from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tct8-building-management-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///building_management.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')  # admin, customer
    is_hidden = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(3), unique=True, nullable=False)  # 001, 002, 003
    floor = db.Column(db.Integer, nullable=False)
    room_type = db.Column(db.String(50), nullable=False)  # Studio, 1BR, 2BR, etc.
    area = db.Column(db.Float)  # in m2
    status = db.Column(db.String(20), default='available')  # available, occupied, maintenance
    monthly_fee = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    id_number = db.Column(db.String(20))  # CCCD/CMND
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    move_in_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')  # active, inactive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    room = db.relationship('Room', backref='customers')
    user = db.relationship('User', backref='customer_profile')

class Equipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    equipment_type = db.Column(db.String(50), nullable=False)  # Elevator, AC, Generator, etc.
    location = db.Column(db.String(100))
    serial_number = db.Column(db.String(50))
    purchase_date = db.Column(db.DateTime)
    warranty_until = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')  # active, broken, maintenance
    last_maintenance = db.Column(db.DateTime)
    next_maintenance = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MaintenanceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    maintenance_type = db.Column(db.String(50), nullable=False)  # routine, repair, emergency
    description = db.Column(db.Text)
    technician = db.Column(db.String(100))
    cost = db.Column(db.Float, default=0.0)
    scheduled_date = db.Column(db.DateTime, nullable=False)
    completed_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, in_progress, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    equipment = db.relationship('Equipment', backref='maintenance_records')

class Fee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    fee_type = db.Column(db.String(50), nullable=False)  # monthly_rent, utilities, parking, etc.
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    paid_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')  # pending, paid, overdue
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    customer = db.relationship('Customer', backref='fees')

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='general')  # general, maintenance, payment, emergency
    target_users = db.Column(db.String(20), default='all')  # all, customers, specific_user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # for specific user notifications
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')

# Authentication decorator
def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def admin_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            flash('Bạn không có quyền truy cập trang này.', 'error')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # Only show non-hidden users in login
        user = User.query.filter_by(username=username, is_hidden=False).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            flash(f'Chào mừng {user.username}!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Tên đăng nhập hoặc mật khẩu không đúng.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Đã đăng xuất thành công.', 'info')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    
    # Get statistics for dashboard
    stats = {
        'total_rooms': Room.query.count(),
        'occupied_rooms': Room.query.filter_by(status='occupied').count(),
        'total_customers': Customer.query.filter_by(status='active').count(),
        'total_equipment': Equipment.query.count(),
        'maintenance_pending': MaintenanceRecord.query.filter_by(status='scheduled').count(),
        'equipment_broken': Equipment.query.filter_by(status='broken').count()
    }
    
    return render_template('dashboard.html', user=user, stats=stats)

# Room Management Routes
@app.route('/rooms')
@admin_required
def rooms():
    rooms = Room.query.all()
    return render_template('rooms.html', rooms=rooms)

@app.route('/add_room')
@admin_required
def add_room():
    return render_template('add_room.html')

@app.route('/add_room', methods=['POST'])
@admin_required
def add_room_post():
    try:
        room_number = request.form['room_number']
        floor = int(request.form['floor'])
        room_type = request.form['room_type']
        area = float(request.form['area']) if request.form['area'] else None
        monthly_fee = float(request.form['monthly_fee']) if request.form['monthly_fee'] else 0.0
        status = request.form['status']
        
        # Check if room number already exists
        existing_room = Room.query.filter_by(room_number=room_number).first()
        if existing_room:
            flash(f'Phòng số {room_number} đã tồn tại.', 'error')
            return redirect(url_for('add_room'))
        
        # Create new room
        new_room = Room(
            room_number=room_number,
            floor=floor,
            room_type=room_type,
            area=area,
            monthly_fee=monthly_fee,
            status=status
        )
        
        db.session.add(new_room)
        db.session.commit()
        
        flash(f'Đã thêm phòng {room_number} thành công!', 'success')
        return redirect(url_for('rooms'))
        
    except Exception as e:
        flash(f'Có lỗi xảy ra: {str(e)}', 'error')
        return redirect(url_for('add_room'))

# Customer Management Routes
@app.route('/customers')
@admin_required
def customers():
    customers = Customer.query.all()
    return render_template('customers.html', customers=customers)

@app.route('/add_customer')
@admin_required
def add_customer():
    rooms = Room.query.filter_by(status='available').all()
    return render_template('add_customer.html', rooms=rooms)

@app.route('/add_customer', methods=['POST'])
@admin_required
def add_customer_post():
    try:
        full_name = request.form['full_name']
        phone = request.form['phone'] if request.form['phone'] else None
        email = request.form['email'] if request.form['email'] else None
        id_number = request.form['id_number'] if request.form['id_number'] else None
        room_id = int(request.form['room_id']) if request.form['room_id'] else None
        move_in_date = datetime.strptime(request.form['move_in_date'], '%Y-%m-%d') if request.form['move_in_date'] else None
        status = request.form['status']
        create_user_account = 'create_user_account' in request.form
        
        # Create user account if requested
        user_id = None
        if create_user_account:
            username = request.form['username']
            password = request.form['password']
            
            # Check if username already exists
            existing_user = User.query.filter_by(username=username).first()
            if existing_user:
                flash(f'Tên đăng nhập "{username}" đã tồn tại.', 'error')
                return redirect(url_for('add_customer'))
            
            # Create user account (hidden from main login)
            new_user = User(username=username, role='customer', is_hidden=True)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.flush()  # Get the user ID
            user_id = new_user.id
        
        # Create customer
        new_customer = Customer(
            full_name=full_name,
            phone=phone,
            email=email,
            id_number=id_number,
            room_id=room_id,
            user_id=user_id,
            move_in_date=move_in_date,
            status=status
        )
        
        db.session.add(new_customer)
        
        # Update room status if room is assigned
        if room_id:
            room = Room.query.get(room_id)
            if room:
                room.status = 'occupied'
        
        db.session.commit()
        
        success_message = f'Đã thêm khách hàng "{full_name}" thành công!'
        if create_user_account:
            success_message += f' Tài khoản đăng nhập: {username}'
        
        flash(success_message, 'success')
        return redirect(url_for('customers'))
        
    except Exception as e:
        db.session.rollback()
        flash(f'Có lỗi xảy ra: {str(e)}', 'error')
        return redirect(url_for('add_customer'))

# Equipment Management Routes
@app.route('/equipment')
@admin_required
def equipment():
    from datetime import date
    equipment_list = Equipment.query.all()
    today = date.today()
    return render_template('equipment.html', equipment_list=equipment_list, today=today)

@app.route('/add_equipment')
@admin_required
def add_equipment():
    return render_template('add_equipment.html')

@app.route('/add_equipment', methods=['POST'])
@admin_required
def add_equipment_post():
    try:
        name = request.form['name']
        equipment_type = request.form['equipment_type']
        location = request.form['location'] if request.form['location'] else None
        serial_number = request.form['serial_number'] if request.form['serial_number'] else None
        purchase_date = datetime.strptime(request.form['purchase_date'], '%Y-%m-%d').date() if request.form['purchase_date'] else None
        warranty_until = datetime.strptime(request.form['warranty_until'], '%Y-%m-%d').date() if request.form['warranty_until'] else None
        status = request.form['status']
        last_maintenance = datetime.strptime(request.form['last_maintenance'], '%Y-%m-%d').date() if request.form['last_maintenance'] else None
        next_maintenance = datetime.strptime(request.form['next_maintenance'], '%Y-%m-%d').date() if request.form['next_maintenance'] else None
        
        # Create new equipment
        new_equipment = Equipment(
            name=name,
            equipment_type=equipment_type,
            location=location,
            serial_number=serial_number,
            purchase_date=purchase_date,
            warranty_until=warranty_until,
            status=status,
            last_maintenance=last_maintenance,
            next_maintenance=next_maintenance
        )
        
        db.session.add(new_equipment)
        db.session.commit()
        
        flash(f'Đã thêm thiết bị "{name}" thành công!', 'success')
        return redirect(url_for('equipment'))
        
    except Exception as e:
        flash(f'Có lỗi xảy ra: {str(e)}', 'error')
        return redirect(url_for('add_equipment'))

@app.route('/add_maintenance')
@admin_required
def add_maintenance():
    equipment_list = Equipment.query.all()
    return render_template('add_maintenance.html', equipment_list=equipment_list)

@app.route('/add_maintenance', methods=['POST'])
@admin_required
def add_maintenance_post():
    try:
        equipment_id = int(request.form['equipment_id'])
        maintenance_type = request.form['maintenance_type']
        description = request.form['description'] if request.form['description'] else None
        technician = request.form['technician'] if request.form['technician'] else None
        scheduled_date = datetime.strptime(request.form['scheduled_date'], '%Y-%m-%dT%H:%M')
        estimated_cost = float(request.form['estimated_cost']) if request.form['estimated_cost'] else 0.0
        status = request.form['status']
        
        # Handle completion fields if status is completed
        completed_date = None
        actual_cost = None
        if status == 'completed':
            if request.form['completed_date']:
                completed_date = datetime.strptime(request.form['completed_date'], '%Y-%m-%dT%H:%M')
            if request.form['actual_cost']:
                actual_cost = float(request.form['actual_cost'])
        
        # Create new maintenance record
        new_maintenance = MaintenanceRecord(
            equipment_id=equipment_id,
            maintenance_type=maintenance_type,
            description=description,
            technician=technician,
            cost=actual_cost if actual_cost else estimated_cost,
            scheduled_date=scheduled_date,
            completed_date=completed_date,
            status=status
        )
        
        db.session.add(new_maintenance)
        
        # Update equipment status and maintenance dates if completed
        if status == 'completed':
            equipment = Equipment.query.get(equipment_id)
            if equipment:
                equipment.last_maintenance = completed_date.date() if completed_date else scheduled_date.date()
                equipment.status = 'active'  # Set back to active after maintenance
        
        db.session.commit()
        
        flash(f'Đã lập lịch bảo trì thành công!', 'success')
        return redirect(url_for('equipment'))
        
    except Exception as e:
        flash(f'Có lỗi xảy ra: {str(e)}', 'error')
        return redirect(url_for('add_maintenance'))

# Fee Management Routes
@app.route('/fees')
@admin_required
def fees():
    fees = Fee.query.all()
    return render_template('fees.html', fees=fees)

# Reports Routes
@app.route('/reports')
@admin_required
def reports():
    return render_template('reports.html')

# Notifications Routes
@app.route('/notifications')
@login_required
def notifications():
    if session['role'] == 'admin':
        notifications = Notification.query.all()
    else:
        notifications = Notification.query.filter(
            (Notification.target_users == 'all') | 
            (Notification.target_users == 'customers') |
            (Notification.user_id == session['user_id'])
        ).all()
    return render_template('notifications.html', notifications=notifications)

# Customer-only routes
@app.route('/report_issue')
@login_required
def report_issue():
    if session['role'] != 'customer':
        flash('Chỉ khách hàng mới có thể báo cáo sự cố.', 'error')
        return redirect(url_for('dashboard'))
    return render_template('report_issue.html')

@app.route('/payments')
@login_required
def payments():
    if session['role'] != 'customer':
        flash('Chỉ khách hàng mới có thể truy cập trang thanh toán.', 'error')
        return redirect(url_for('dashboard'))
    
    customer = Customer.query.filter_by(user_id=session['user_id']).first()
    if customer:
        fees = Fee.query.filter_by(customer_id=customer.id).all()
    else:
        fees = []
    
    return render_template('payments.html', fees=fees)

# Initialize database
def create_tables():
    db.create_all()
    
    # Create default admin user if doesn't exist
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(username='admin', role='admin', is_hidden=False)
        admin.set_password('123456@')
        db.session.add(admin)
        db.session.commit()
        print("Default admin user created: admin/123456@")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create default admin user if doesn't exist
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(username='admin', role='admin', is_hidden=False)
            admin.set_password('123456@')
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created: admin/123456@")
    
    app.run(debug=True, host='0.0.0.0', port=5000)