import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { orderApi, reviewApi } from "../services/api";
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

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const paymentMethodLabel = (method) => {
  const normalized = String(method || "").toUpperCase();
  if (normalized === "COD") return "Thanh toán khi nhận hàng";
  if (normalized === "BANK_TRANSFER") return "Chuyển khoản ngân hàng";
  if (normalized === "VNPAY") return "VNPay";
  return method || "Chưa xác định";
};

const resolveProductImage = (raw) => {
  if (!raw || !String(raw).trim()) return "/img/products/product-1.jpg";
  if (
    String(raw).startsWith("http://") ||
    String(raw).startsWith("https://") ||
    String(raw).startsWith("/")
  ) {
    return raw;
  }
  if (String(raw).includes("/")) {
    return `/img/${raw}`;
  }
  return `/img/products/${raw}`;
};

const MyOrders = () => {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await orderApi.getMyOrders();
      setOrders(Array.isArray(response.data) ? response.data : []);

      try {
        const reviewsResponse = await reviewApi.getMine();
        setReviewedProductIds(
          new Set((Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []).map((review) => review.productId)),
        );
      } catch (reviewsError) {
        console.error("Không thể tải lịch sử đánh giá", reviewsError);
        setReviewedProductIds(new Set());
      }
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

  const openReview = (order, detail) => {
    setReviewTarget({
      orderId: order.id,
      productId: detail.productId ?? detail.product?.id,
      productName: detail.product?.name || "Sản phẩm",
      productImage: detail.product?.imageUrl,
    });
    setRating(5);
    setComment("");
  };

  const closeReview = () => {
    if (submittingReview) return;
    setReviewTarget(null);
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewTarget) return;

    setSubmittingReview(true);
    try {
      await reviewApi.create({
        orderId: reviewTarget.orderId,
        productId: reviewTarget.productId,
        rating,
        comment: comment.trim(),
      });
      setReviewedProductIds((current) => new Set([...current, reviewTarget.productId]));
      setReviewTarget(null);
      await alertSuccess("Cảm ơn bạn!", "Đánh giá sản phẩm đã được gửi thành công.");
    } catch (err) {
      alertError("Không thể gửi đánh giá", err.response?.data?.message || "Vui lòng thử lại sau.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const exportInvoice = (order) => {
    const details = Array.isArray(order.orderDetailOrders) ? order.orderDetailOrders : [];
    const subtotal = details.reduce(
      (sum, detail) => sum + Number(detail.unitPrice || 0) * Number(detail.quantity || 0),
      0,
    );
    const shippingFee = Number(order.shippingFee || 0);
    const discountAmount = Number(order.discountAmount || 0);
    const totalBeforeDiscount = Number(order.totalAmount || subtotal + shippingFee);
    const adjustment = Math.max(0, totalBeforeDiscount - subtotal - shippingFee);
    const finalAmount = Number(order.finalAmount ?? totalBeforeDiscount - discountAmount);
    const customerName = user?.name || user?.Name || user?.userName || user?.UserName || "Khách hàng";
    const customerEmail = user?.email || user?.Email || "";
    const customerPhone = user?.phone || user?.Phone || user?.contact || user?.Contact || "";
    const invoiceCode = order.orderCode || `HD-${order.id}`;

    const itemRows = details.map((detail, index) => {
      const variant = detail.productVariant
        ? [detail.productVariant.sizeNavigation?.name, detail.productVariant.colorNavigation?.name]
            .filter(Boolean)
            .join(" / ")
        : "";
      const quantity = Number(detail.quantity || 0);
      const unitPrice = Number(detail.unitPrice || 0);

      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td>
            <strong>${escapeHtml(detail.product?.name || "Sản phẩm")}</strong>
            ${variant ? `<div class="muted">${escapeHtml(variant)}</div>` : ""}
          </td>
          <td class="center">${quantity}</td>
          <td class="right">${escapeHtml(formatMoney(unitPrice))}</td>
          <td class="right">${escapeHtml(formatMoney(unitPrice * quantity))}</td>
        </tr>
      `;
    }).join("");

    const invoiceWindow = window.open("", "_blank", "width=960,height=720");
    if (!invoiceWindow) {
      alertError("Không thể mở hóa đơn", "Vui lòng cho phép cửa sổ bật lên và thử lại.");
      return;
    }

    invoiceWindow.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Hóa đơn ${escapeHtml(invoiceCode)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; color: #222; font-family: Arial, sans-serif; font-size: 14px; }
            .invoice { width: 100%; max-width: 900px; margin: 0 auto; padding: 40px; }
            .header { display: flex; justify-content: space-between; gap: 32px; border-bottom: 3px solid #e7ab3c; padding-bottom: 22px; }
            .brand h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: 0; }
            .brand p, .invoice-meta p, .customer p { margin: 4px 0; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { margin: 0 0 8px; color: #e7ab3c; font-size: 26px; }
            .customer { margin: 26px 0; padding: 16px; background: #f7f7f7; }
            .customer h3 { margin: 0 0 10px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #222; color: #fff; font-weight: 600; padding: 11px 9px; }
            td { border-bottom: 1px solid #ddd; padding: 11px 9px; vertical-align: top; }
            .center { text-align: center; }
            .right { text-align: right; }
            .muted { margin-top: 4px; color: #777; font-size: 12px; }
            .totals { width: 380px; margin: 24px 0 0 auto; }
            .totals-row { display: flex; justify-content: space-between; gap: 20px; padding: 7px 0; }
            .grand-total { border-top: 2px solid #222; margin-top: 7px; padding-top: 12px; color: #c0392b; font-size: 18px; font-weight: 700; }
            .footer { margin-top: 46px; border-top: 1px solid #ddd; padding-top: 18px; text-align: center; color: #666; font-size: 12px; }
            .no-print { margin: 20px auto 0; display: block; border: 0; background: #e7ab3c; color: #fff; padding: 11px 22px; font-weight: 700; cursor: pointer; }
            @media print {
              .invoice { max-width: none; padding: 18px; }
              .no-print { display: none; }
              @page { size: A4; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <main class="invoice">
            <header class="header">
              <div class="brand">
                <h1>Fashi Fashion</h1>
                <p>Thời trang cho mọi phong cách</p>
              </div>
              <div class="invoice-title">
                <h2>HÓA ĐƠN BÁN HÀNG</h2>
                <p><strong>Số:</strong> ${escapeHtml(invoiceCode)}</p>
                <p><strong>Ngày:</strong> ${escapeHtml(new Date(order.orderDate).toLocaleString("vi-VN"))}</p>
              </div>
            </header>

            <section class="customer">
              <h3>Thông tin khách hàng</h3>
              <p><strong>Họ tên:</strong> ${escapeHtml(customerName)}</p>
              ${customerPhone ? `<p><strong>Số điện thoại:</strong> ${escapeHtml(customerPhone)}</p>` : ""}
              ${customerEmail ? `<p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>` : ""}
              <p><strong>Địa chỉ giao hàng:</strong> ${escapeHtml(order.shippingAddress || "Chưa cập nhật")}</p>
              <p><strong>Phương thức thanh toán:</strong> ${escapeHtml(paymentMethodLabel(order.paymentMethod))}</p>
            </section>

            <table>
              <thead>
                <tr>
                  <th style="width: 50px">STT</th>
                  <th>Sản phẩm</th>
                  <th style="width: 80px">SL</th>
                  <th style="width: 150px">Đơn giá</th>
                  <th style="width: 160px">Thành tiền</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <section class="totals">
              <div class="totals-row"><span>Tạm tính</span><strong>${escapeHtml(formatMoney(subtotal))}</strong></div>
              <div class="totals-row"><span>Phí vận chuyển</span><strong>${escapeHtml(formatMoney(shippingFee))}</strong></div>
              ${adjustment > 0 ? `<div class="totals-row"><span>Thuế/điều chỉnh</span><strong>${escapeHtml(formatMoney(adjustment))}</strong></div>` : ""}
              ${discountAmount > 0 ? `<div class="totals-row"><span>Giảm giá</span><strong>-${escapeHtml(formatMoney(discountAmount))}</strong></div>` : ""}
              <div class="totals-row grand-total"><span>Tổng thanh toán</span><span>${escapeHtml(formatMoney(finalAmount))}</span></div>
            </section>

            <footer class="footer">
              Cảm ơn quý khách đã mua sắm tại Fashi Fashion.
            </footer>
            <button class="no-print" type="button" onclick="window.print()">In / Lưu PDF</button>
          </main>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
    invoiceWindow.focus();
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
                          {order.orderDetailOrders?.map((detail) => {
                            const productId = detail.productId ?? detail.product?.id;
                            const hasReviewed = reviewedProductIds.has(productId);
                            return (
                            <div key={detail.id} className="d-flex align-items-center mb-2">
                              <img 
                                src={resolveProductImage(detail.product?.imageUrl)}
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
                              {order.status === "DELIVERED" && (
                                hasReviewed ? (
                                  <span className="badge badge-success ml-3">Đã đánh giá</span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-warning ml-3"
                                    onClick={() => openReview(order, detail)}
                                  >
                                    <i className="fa fa-star mr-1"></i>
                                    Đánh giá
                                  </button>
                                )
                              )}
                            </div>
                          )})}
                        </div>
                        <p className="mb-1"><i className="fa fa-map-marker"></i> {order.shippingAddress || "Chưa có địa chỉ giao hàng"}</p>
                        <p className="mb-0"><i className="fa fa-money"></i> Tổng thanh toán: <strong className="text-danger" style={{ fontSize: '18px' }}>{formatMoney(order.finalAmount ?? order.totalAmount)}</strong></p>
                      </div>
                      <div className="order-actions">
                        <Link to={`/orders/${order.id}/tracking`} className="primary-btn">Theo dõi đơn</Link>
                        {order.status === "DELIVERED" && (
                          <button type="button" className="outline-btn" onClick={() => exportInvoice(order)}>
                            <i className="fa fa-file-text-o mr-1"></i>
                            Xuất hóa đơn
                          </button>
                        )}
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

      {reviewTarget && (
        <div
          className="modal d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReview();
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={submitReview}>
                <div className="modal-header">
                  <h5 className="modal-title" id="review-modal-title">Đánh giá sản phẩm</h5>
                  <button type="button" className="close" onClick={closeReview} disabled={submittingReview}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="d-flex align-items-center mb-4">
                    <img
                      src={resolveProductImage(reviewTarget.productImage)}
                      alt={reviewTarget.productName}
                      style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }}
                      className="mr-3"
                    />
                    <strong>{reviewTarget.productName}</strong>
                  </div>

                  <div className="form-group text-center">
                    <label className="d-block font-weight-bold">Bạn cảm thấy sản phẩm thế nào?</label>
                    <div>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="btn btn-link p-1"
                          onClick={() => setRating(star)}
                          aria-label={`${star} sao`}
                          style={{ fontSize: 30, color: "#e7ab3c", textDecoration: "none" }}
                        >
                          <i className={star <= rating ? "fa fa-star" : "fa fa-star-o"}></i>
                        </button>
                      ))}
                    </div>
                    <div className="text-muted">{rating}/5 sao</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="review-comment">Nhận xét của bạn</label>
                    <textarea
                      id="review-comment"
                      className="form-control"
                      rows="4"
                      maxLength="1000"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Chia sẻ cảm nhận về chất lượng, màu sắc, kích thước..."
                    />
                    <small className="form-text text-muted text-right">{comment.length}/1000</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeReview} disabled={submittingReview}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-warning text-white" disabled={submittingReview}>
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </LayoutPublic>
  );
};

export default MyOrders;
