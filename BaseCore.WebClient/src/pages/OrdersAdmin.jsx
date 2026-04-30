import React, { useEffect, useState } from "react";
import { orderApi } from "../services/api";

const ORDER_STATUSES = [
  { value: "CHO_XU_LY", label: "Pending" },
  { value: "DANG_VAN_CHUYEN", label: "Shipping" },
  { value: "DA_VAN_CHUYEN", label: "Delivered" },
  { value: "HUY", label: "Cancelled" },
];

const getOrderStatusLabel = (value) => {
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
    await orderApi.updateStatus(orderId, nextStatus);
    alert("Cap nhat trang thai thanh cong");
    await loadOrders();
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
                  placeholder="Ma don / UserId"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <select
                  className="form-control mr-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Tat ca trang thai</option>
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
                  Search
                </button>
              </form>
            </div>
            <div className="card-body">
              {loading ? (
                <div>Loading...</div>
              ) : (
                <>
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((order) => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.userId}</td>
                          <td>{new Date(order.orderDate).toLocaleString()}</td>
                          <td>{order.totalAmount?.toLocaleString()} VND</td>
                          <td>{getOrderStatusLabel(order.status)}</td>
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
