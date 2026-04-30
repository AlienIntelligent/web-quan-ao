import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="wrapper">
            {/* Navbar */}
            <nav className="main-header navbar navbar-expand navbar-white navbar-light">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" data-widget="pushmenu" href="#" role="button">
                            <i className="fas fa-bars"></i>
                        </a>
                    </li>
                    <li className="nav-item d-none d-sm-inline-block">
                        <Link to="/home" className="nav-link">Home</Link>
                    </li>
                </ul>

                <ul className="navbar-nav ml-auto">
                    <li className="nav-item dropdown">
                        <a className="nav-link" data-toggle="dropdown" href="#">
                            <i className="far fa-user"></i> {user?.name || user?.username}
                        </a>
                        <div className="dropdown-menu dropdown-menu-right">
                            <span className="dropdown-item dropdown-header">
                                {user?.email}
                            </span>
                            <div className="dropdown-divider"></div>
                            <Link to="/home" className="dropdown-item">
                                <i className="fas fa-store mr-2"></i> Open Storefront
                            </Link>
                            <button className="dropdown-item" onClick={handleLogout}>
                                <i className="fas fa-sign-out-alt mr-2"></i> Logout
                            </button>
                        </div>
                    </li>
                </ul>
            </nav>

            {/* Sidebar */}
            <aside className="main-sidebar sidebar-dark-primary elevation-4">
                <Link to="/" className="brand-link">
                    <span className="brand-text font-weight-light ml-3">
                        <b>Store</b> Sales
                    </span>
                </Link>

                <div className="sidebar">
                    <div className="user-panel mt-3 pb-3 mb-3 d-flex">
                        <div className="image">
                            <i className="fas fa-user-circle fa-2x text-light"></i>
                        </div>
                        <div className="info">
                            <Link to="#" className="d-block">{user?.name || user?.username}</Link>
                        </div>
                    </div>

                    <nav className="mt-2">
                        <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
                            <li className="nav-item">
                                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                                    <i className="nav-icon fas fa-tachometer-alt"></i>
                                    <p>Dashboard</p>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/products" className={`nav-link ${isActive('/products')}`}>
                                    <i className="nav-icon fas fa-box"></i>
                                    <p>Products</p>
                                </Link>
                            </li>
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/product-variants" className={`nav-link ${isActive('/product-variants')}`}>
                                        <i className="nav-icon fas fa-layer-group"></i>
                                        <p>Product Variants</p>
                                    </Link>
                                </li>
                            )}
                            <li className="nav-item">
                                <Link to="/categories" className={`nav-link ${isActive('/categories')}`}>
                                    <i className="nav-icon fas fa-tags"></i>
                                    <p>Categories</p>
                                </Link>
                            </li>
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/reviews" className={`nav-link ${isActive('/reviews')}`}>
                                        <i className="nav-icon fas fa-star"></i>
                                        <p>Reviews</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/origins" className={`nav-link ${isActive('/origins')}`}>
                                        <i className="nav-icon fas fa-industry"></i>
                                        <p>Origins</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/promotions" className={`nav-link ${isActive('/promotions')}`}>
                                        <i className="nav-icon fas fa-percentage"></i>
                                        <p>Promotions</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/shippings" className={`nav-link ${isActive('/shippings')}`}>
                                        <i className="nav-icon fas fa-truck"></i>
                                        <p>Shippings</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                                        <i className="nav-icon fas fa-file-invoice"></i>
                                        <p>Orders</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/product-origins" className={`nav-link ${isActive('/product-origins')}`}>
                                        <i className="nav-icon fas fa-link"></i>
                                        <p>ProductOrigins</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/order-details" className={`nav-link ${isActive('/order-details')}`}>
                                        <i className="nav-icon fas fa-list"></i>
                                        <p>OrderDetails</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/order-promotions" className={`nav-link ${isActive('/order-promotions')}`}>
                                        <i className="nav-icon fas fa-tags"></i>
                                        <p>OrderPromotions</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/cart-details" className={`nav-link ${isActive('/cart-details')}`}>
                                        <i className="nav-icon fas fa-shopping-cart"></i>
                                        <p>CartDetails</p>
                                    </Link>
                                </li>
                            )}
                            {isAdmin() && (
                                <li className="nav-item">
                                    <Link to="/users" className={`nav-link ${isActive('/users')}`}>
                                        <i className="nav-icon fas fa-users"></i>
                                        <p>Users</p>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Content */}
            {children}

            {/* Footer */}
            <footer className="main-footer">
                <strong>Copyright &copy; 2024 <a href="#">BaseCore Sales</a>.</strong>
                <div className="float-right d-none d-sm-inline-block">
                    <b>Version</b> 1.0.0
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
