import React, { useEffect, useState } from 'react';
import { orderApi, orderDetailApi } from '../services/api';

const ORDER_STATUSES = [
    { value: 'PENDING',    label: 'Chờ xử lý' },
    { value: 'CONFIRMED',  label: 'Đã xác nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý hủy' },
    { value: 'SHIPPED',    label: 'Đã lấy hàng' },
    { value: 'DELIVERING', label: 'Đang giao' },
    { value: 'DELIVERED',  label: 'Đã giao' },
    { value: 'CANCELLED',  label: 'Đã hủy' },
    { value: 'RETURNED',   label: 'Đã hoàn' },
];

const STATUS_BADGE = {
    PENDING:    'badge-info',
    CONFIRMED:  'badge-primary',
    PROCESSING: 'badge-warning',
    SHIPPED:    'badge-secondary',
    DELIVERING: 'badge-primary',
    DELIVERED:  'badge-success',
    CANCELLED:  'badge-danger',
    RETURNED:   'badge-dark',
};

const OrdersAdmin = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const loadOrders = async (nextPage = page) => {
        setLoading(true);
        try {
            const response = await orderApi.getAll({
                keyword: keyword || undefined,
                status: status || undefined,
                fromDate: fromDate || undefined,
                page: nextPage,
                pageSize,
            });
            setItems(response.data.items || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalCount(response.data.totalCount || 0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOrders(); }, [page]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setPage(1);
        await loadOrders(1);
    };

    const changeStatus = async (orderId, nextStatus) => {
        if (nextStatus === 'HUY') {
            if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
        }
        try {
            await orderApi.updateStatus(orderId, nextStatus);
            await loadOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    const viewDetails = async (order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
        setDetailsLoading(true);
        try {
            const res = await orderDetailApi.getAll({ orderId: order.id, pageSize: 100 });
            setOrderDetails(res.data.items || []);
        } catch (e) {
            console.error(e);
        } finally {
            setDetailsLoading(false);
        }
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i)}>{i}</button>
                </li>
            );
        }
        return pages;
    };

    const formatMoney = (v) => Number(v || 0).toLocaleString('vi-VN') + ' đ';

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Quản lý Đơn hàng</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-8">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <input
                                            type="text"
                                            className="form-control mr-2"
                                            placeholder="Tìm theo mã đơn, khách hàng..."
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                        />
                                        <select
                                            className="form-control mr-2"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            {ORDER_STATUSES.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="date"
                                            className="form-control mr-2"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-primary">
                                            <i className="fas fa-search"></i> Tìm
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                </div>
                            ) : (
                                <>
                                    <table className="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Khách hàng (ID)</th>
                                                <th>Ngày đặt</th>
                                                <th>Phương thức TT</th>
                                                <th>TT thanh toán</th>
                                                <th>Tổng tiền</th>
                                                <th>Giảm giá</th>
                                                <th>Thành tiền</th>
                                                <th>Trạng thái</th>
                                                <th>Đổi TT</th>
                                                <th style={{ width: '90px' }}>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan="11" className="text-center py-4">Không tìm thấy đơn hàng nào</td>
                                                </tr>
                                            ) : (
                                                items.map(order => (
                                                    <tr key={order.id}>
                                                        <td><strong>#{order.orderCode || order.id}</strong></td>
                                                        <td>
                                                            <div>{order.user?.name || order.userId?.substring(0, 10)}</div>
                                                            <small className="text-muted">{order.shippingAddress?.substring(0, 25)}...</small>
                                                        </td>
                                                        <td>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                                                        <td><small>{order.paymentMethod}</small></td>
                                                        <td>
                                                            <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                                                                {order.paymentStatus === 'PAID' ? 'Đã TT' : 'Chưa TT'}
                                                            </span>
                                                        </td>
                                                        <td>{formatMoney(order.totalAmount)}</td>
                                                        <td>{order.discountAmount > 0 ? <span className="text-success">-{formatMoney(order.discountAmount)}</span> : '-'}</td>
                                                        <td><strong className="text-danger">{formatMoney(order.finalAmount)}</strong></td>
                                                        <td>
                                                            <span className={`badge ${STATUS_BADGE[order.status] || 'badge-secondary'}`}>
                                                                {ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="form-control form-control-sm"
                                                                value={order.status}
                                                                onChange={(e) => changeStatus(order.id, e.target.value)}
                                                                style={{ minWidth: '130px' }}
                                                            >
                                                                {ORDER_STATUSES.map(s => (
                                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-info"
                                                                onClick={() => viewDetails(order)}
                                                                title="Xem chi tiết"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>Tổng: {totalCount} đơn hàng</span>
                                        <nav>
                                            <ul className="pagination mb-0">
                                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                    <button className="page-link" onClick={() => setPage(page - 1)}>Trước</button>
                                                </li>
                                                {renderPagination()}
                                                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                                    <button className="page-link" onClick={() => setPage(page + 1)}>Sau</button>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Chi tiết Đơn hàng #{selectedOrder.orderCode || selectedOrder.id}
                                </h5>
                                <button type="button" className="close" onClick={() => setShowDetailModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {/* Order Info */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <strong>Khách hàng:</strong><br />
                                        <span>{selectedOrder.userId}</span>
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Ngày đặt:</strong><br />
                                        <span>{new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Phương thức TT:</strong><br />
                                        <span className="badge badge-secondary">{selectedOrder.paymentMethod}</span>
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Trạng thái TT:</strong><br />
                                        <span className={`badge ${selectedOrder.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <strong>Địa chỉ giao hàng:</strong><br />
                                        <span>{selectedOrder.shippingAddress}</span>
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Phí vận chuyển:</strong><br />
                                        <span>{formatMoney(selectedOrder.shippingFee)}</span>
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Trạng thái:</strong><br />
                                        <span className={`badge ${STATUS_BADGE[selectedOrder.status] || 'badge-secondary'}`}>
                                            {ORDER_STATUSES.find(s => s.value === selectedOrder.status)?.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Details Table */}
                                {detailsLoading ? (
                                    <div className="text-center py-3">
                                        <div className="spinner-border text-primary"></div>
                                    </div>
                                ) : (
                                    <table className="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th>Sản phẩm</th>
                                                <th>Biến thể</th>
                                                <th className="text-center">SL</th>
                                                <th className="text-right">Đơn giá</th>
                                                <th className="text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderDetails.map(d => (
                                                <tr key={d.id}>
                                                    <td>{d.productName || `SP #${d.productId}`}</td>
                                                    <td>{d.variantInfo || '-'}</td>
                                                    <td className="text-center">{d.quantity}</td>
                                                    <td className="text-right">{formatMoney(d.unitPrice)}</td>
                                                    <td className="text-right">{formatMoney(d.quantity * d.unitPrice)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="4" className="text-right"><strong>Tổng tiền hàng:</strong></td>
                                                <td className="text-right">{formatMoney(selectedOrder.totalAmount)}</td>
                                            </tr>
                                            {selectedOrder.discountAmount > 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-right text-success">Giảm giá:</td>
                                                    <td className="text-right text-success">-{formatMoney(selectedOrder.discountAmount)}</td>
                                                </tr>
                                            )}
                                            {selectedOrder.shippingFee > 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-right text-muted">Phí vận chuyển:</td>
                                                    <td className="text-right text-muted">{formatMoney(selectedOrder.shippingFee)}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td colSpan="4" className="text-right"><strong>THÀNH TIỀN:</strong></td>
                                                <td className="text-right"><strong className="text-danger">{formatMoney(selectedOrder.finalAmount)}</strong></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}

                                {selectedOrder.cancelledReason && (
                                    <div className="alert alert-warning mt-2">
                                        <strong>Lý do hủy:</strong> {selectedOrder.cancelledReason}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showDetailModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default OrdersAdmin;
