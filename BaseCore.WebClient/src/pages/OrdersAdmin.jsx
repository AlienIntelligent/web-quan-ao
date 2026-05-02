import React, { useEffect, useState } from "react";
import { orderApi } from "../services/api";

const ORDER_STATUSES = [
  { value: "CHO_XU_LY", label: "Pending" },
  { value: "DANG_VAN_CHUYEN", label: "Shipping" },
  { value: "DA_VAN_CHUYEN", label: "Delivered" },
  { value: "HUY", label: "Cancelled" },
  { value: "CHO_DUYET_HUY", label: "Request Cancel" },
];

const getOrderStatusLabel = (value) => {
  if (value === "CHO_DUYET_HUY") return "Chờ duyệt hủy";
  return ORDER_STATUSES.find((x) => x.value === value)?.label || value;
};

const OrdersAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getAll({
        keyword: keyword || undefined,
        status: status || undefined,
        fromDate: fromDate || undefined,
        page,
        pageSize,
      });
      setItems(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalCount(response.data.totalCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadOrders();
  };

  const changeStatus = async (orderId, nextStatus) => {
    const isCancel = nextStatus === "HUY";
    if (isCancel) {
      if (!window.confirm("Xác nhận duyệt hủy đơn hàng này? Tồn kho sẽ được hoàn lại.")) {
        return;
      }
    }

    try {
      await orderApi.updateStatus(orderId, nextStatus);
      alert("Cập nhật trạng thái thành công");
      await loadOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0">Orders Management</h1>
        </div>
      </div>
      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  className="form-control mr-2"
                  placeholder="Mã đơn / UserId"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <select
                  className="form-control mr-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  {ORDER_STATUSES.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="form-control mr-2"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">
                  Tìm kiếm
                </button>
              </form>
            </div>
            <div className="card-body">
              {loading ? (
                <div>Đang tải...</div>
              ) : (
                <>
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Khách hàng</th>
                        <th>Ngày đặt</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((order) => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.userId}</td>
                          <td>{new Date(order.orderDate).toLocaleString()}</td>
                          <td>{order.totalAmount?.toLocaleString()} VND</td>
                          <td>
                            {order.status === "CHO_DUYET_HUY" ? (
                              <span className="badge badge-warning">Yêu cầu hủy</span>
                            ) : (
                              getOrderStatusLabel(order.status)
                            )}
                          </td>
                          <td>
                            <select
                              className="form-control form-control-sm"
                              value={order.status}
                              onChange={(e) => changeStatus(order.id, e.target.value)}
                            >
                              {ORDER_STATUSES.map((x) => (
                                <option key={x.value} value={x.value}>
                                  {x.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center">
                            Khong co don hang.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Total: {totalCount}</span>
                    <div>
                      <button
                        className="btn btn-outline-secondary btn-sm mr-2"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Prev
                      </button>
                      <span>{page}/{totalPages}</span>
                      <button
                        className="btn btn-outline-secondary btn-sm ml-2"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrdersAdmin;
