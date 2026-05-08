import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { orderApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { alertSuccess, alertError, confirmAction } from "../services/swal";

const STATUS_TABS = [
  { key: "all",       label: "Tất cả",       values: [] },
  { key: "pending",   label: "Chờ xác nhận", values: ["PENDING", "CONFIRMED"] },
  { key: "shipping",  label: "Đang giao",    values: ["SHIPPED", "DELIVERING"] },
  { key: "delivered", label: "Đã giao",      values: ["DELIVERED"] },
  { key: "cancelled", label: "Đã hủy",      values: ["CANCELLED", "RETURNED"] },
];

const statusLabel = (status) => {
  if (status === "PROCESSING") return "Chờ duyệt hủy";
  const match = STATUS_TABS.find((tab) => tab.values.includes(status));
  return match?.label || status || "Đang cập nhật";
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const MyOrders = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await orderApi.getMyOrders();
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách đơn hàng.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const filteredOrders = useMemo(() => {
    const tab = STATUS_TABS.find((x) => x.key === activeTab);
    if (!tab || tab.values.length === 0) return orders;
    return orders.filter((order) => tab.values.includes(order.status));
  }, [activeTab, orders]);

  const cancelOrder = async (orderId) => {
    const result = await confirmAction(
      "Yêu cầu hủy đơn hàng?",
      "Bạn có chắc chắn muốn gửi yêu cầu hủy đơn hàng này không? Yêu cầu cần được Shop duyệt.",
      "Gửi yêu cầu",
    );

    if (result.isConfirmed) {
      try {
        const res = await orderApi.userCancel(orderId);
        await alertSuccess("Đã gửi yêu cầu!", res.data.message || "Yêu cầu hủy đơn đã được gửi thành công.");
        await loadOrders();
      } catch (err) {
        alertError("Lỗi!", err.response?.data?.message || "Không thể gửi yêu cầu hủy đơn.");
      }
    }
  };

  return (
    <LayoutPublic>
      <section className="breadcrumb-section set-bg" style={{ backgroundImage: "url(/img/breadcrumb.jpg)" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Đơn mua</h2>
            </div>
          </div>
        </div>
      </section>

      <section className="customer-section spad">
        <div className="container">
          {!isAuthenticated ? (
            <div className="customer-empty">
              <h4>Đăng nhập để xem đơn hàng</h4>
              <p>Theo dõi trạng thái xử lý, vận chuyển và lịch sử mua hàng của bạn.</p>
              <Link to="/login" className="primary-btn">Đăng nhập</Link>
            </div>
          ) : (
            <>
              <div className="order-tabs">
                {STATUS_TABS.map((tab) => (
                  <button
                    type="button"
                    key={tab.key}
                    className={activeTab === tab.key ? "active" : ""}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {loading && <div className="customer-empty">Đang tải đơn hàng...</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && filteredOrders.length === 0 && (
                <div className="customer-empty">
                  <h4>Chưa có đơn hàng</h4>
                  <p>Các đơn hàng thời trang của bạn sẽ xuất hiện tại đây sau khi đặt mua.</p>
                  <Link to="/shop" className="primary-btn">Mua sắm ngay</Link>
                </div>
              )}

              <div className="order-list">
                {filteredOrders.map((order) => {
                  const canRequestCancel = ["PENDING", "CONFIRMED"].includes(order.status);
                  return (
                    <div className="order-card" key={order.id}>
                      <div className="order-card-header">
                        <div>
                          <strong>Đơn hàng #{order.id}</strong>
                          <span>{new Date(order.orderDate).toLocaleString("vi-VN")}</span>
                        </div>
                        <div className={`order-status ${order.status === "PROCESSING" ? "status-warning" : ""}`}>
                          {statusLabel(order.status)}
                        </div>
                      </div>
                      <div className="order-card-body">
                        <div className="order-items-summary mb-3">
                          {order.orderDetailOrders?.map((detail) => (
                            <div key={detail.id} className="d-flex align-items-center mb-2">
                              <img 
                                src={detail.product?.imageUrl ? (detail.product.imageUrl.startsWith('http') ? detail.product.imageUrl : `/img/products/${detail.product.imageUrl}`) : '/img/products/product-1.jpg'} 
                                alt={detail.product?.name} 
                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                className="mr-3"
                              />
                              <div style={{ flex: 1 }}>
                                <div className="font-weight-bold" style={{ fontSize: '14px' }}>{detail.product?.name}</div>
                                <div className="text-muted small">
                                  {detail.productVariant ? `${detail.productVariant.sizeNavigation?.name} / ${detail.productVariant.colorNavigation?.name}` : 'Không có biến thể'} x {detail.quantity}
                                </div>
                              </div>
                              <div className="text-warning font-weight-bold">{formatMoney(detail.unitPrice)}</div>
                            </div>
                          ))}
                        </div>
                        <p className="mb-1"><i className="fa fa-map-marker"></i> {order.shippingAddress || "Chưa có địa chỉ giao hàng"}</p>
                        <p className="mb-0"><i className="fa fa-money"></i> Tổng thanh toán: <strong className="text-danger" style={{ fontSize: '18px' }}>{formatMoney(order.totalAmount)}</strong></p>
                      </div>
                      <div className="order-actions">
                        <Link to={`/orders/${order.id}/tracking`} className="primary-btn">Theo dõi đơn</Link>
                        {canRequestCancel && (
                          <button type="button" className="outline-btn" onClick={() => cancelOrder(order.id)}>
                            Hủy đơn
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </LayoutPublic>
  );
};

export default MyOrders;
