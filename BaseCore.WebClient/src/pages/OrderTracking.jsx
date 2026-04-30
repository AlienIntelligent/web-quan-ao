import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { orderApi } from "../services/api";

const STEPS = [
  { key: "created", label: "Đã đặt hàng", icon: "fa-check" },
  { key: "processing", label: "Shop xác nhận", icon: "fa-archive" },
  { key: "shipping", label: "Đang giao", icon: "fa-truck" },
  { key: "delivered", label: "Đã giao", icon: "fa-home" },
];

const activeStepByStatus = (status) => {
  if (["DA_VAN_CHUYEN", "Delivered"].includes(status)) return 3;
  if (["DANG_VAN_CHUYEN", "Shipping"].includes(status)) return 2;
  if (["HUY", "Cancelled"].includes(status)) return -1;
  return 1;
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const OrderTracking = () => {
  const { id } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await orderApi.getById(id);
        setPayload(response.data);
      } catch (err) {
        setPayload(null);
        setError(err.response?.data?.message || "Không thể tải chi tiết đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const order = payload?.order;
  const details = Array.isArray(payload?.details) ? payload.details : [];
  const activeStep = useMemo(() => activeStepByStatus(order?.status), [order?.status]);

  return (
    <LayoutPublic>
      <section className="breadcrumb-section set-bg" style={{ backgroundImage: "url(/img/breadcrumb.jpg)" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Theo dõi đơn hàng</h2>
            </div>
          </div>
        </div>
      </section>

      <section className="customer-section spad">
        <div className="container">
          {loading && <div className="customer-empty">Đang tải trạng thái đơn hàng...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && order && (
            <>
              <div className="tracking-summary">
                <div>
                  <span>Mã đơn hàng</span>
                  <h4>#{order.id}</h4>
                </div>
                <div>
                  <span>Ngày đặt</span>
                  <h4>{new Date(order.orderDate).toLocaleDateString("vi-VN")}</h4>
                </div>
                <div>
                  <span>Tổng thanh toán</span>
                  <h4>{formatMoney(order.totalAmount)}</h4>
                </div>
              </div>

              {activeStep === -1 ? (
                <div className="alert alert-warning">Đơn hàng đã bị hủy. Nếu cần hỗ trợ, vui lòng liên hệ shop.</div>
              ) : (
                <div className="tracking-steps">
                  {STEPS.map((step, index) => (
                    <div className={`tracking-step ${index <= activeStep ? "done" : ""}`} key={step.key}>
                      <div className="tracking-icon"><i className={`fa ${step.icon}`}></i></div>
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="row">
                <div className="col-lg-8">
                  <div className="order-card">
                    <div className="order-card-header">
                      <strong>Sản phẩm trong đơn</strong>
                    </div>
                    <div className="tracking-items">
                      {details.map((item) => (
                        <div className="tracking-item" key={item.id}>
                          <img src={item.product?.imageUrl || "/img/products/product-1.jpg"} alt={item.product?.name || "Sản phẩm"} />
                          <div>
                            <h5>{item.product?.name || `Sản phẩm #${item.productId}`}</h5>
                            <span>Số lượng: {item.quantity}</span>
                          </div>
                          <strong>{formatMoney(Number(item.unitPrice || 0) * item.quantity)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="order-card">
                    <div className="order-card-header">
                      <strong>Thông tin giao hàng</strong>
                    </div>
                    <div className="order-card-body">
                      <p><i className="fa fa-map-marker"></i> {order.shippingAddress}</p>
                      <p><i className="fa fa-truck"></i> Cập nhật vận chuyển theo trạng thái đơn hàng của shop.</p>
                    </div>
                    <Link to="/my-orders" className="outline-btn full-width">Quay lại đơn mua</Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </LayoutPublic>
  );
};

export default OrderTracking;
