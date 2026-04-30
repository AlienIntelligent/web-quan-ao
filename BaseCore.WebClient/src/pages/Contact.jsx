import React, { useState } from "react";
import LayoutPublic from "../components/LayoutPublic";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact:", formData);
  };

  return (
    <LayoutPublic>
      {/* Breadcrumb Section Begin */}
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Liên hệ</h2>
            </div>
          </div>
        </div>
      </section>
      {/* Breadcrumb Section End */}

      {/* Contact Section Begin */}
      <section className="contact-section spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <div className="contact-title">
                <h4>Liên hệ với chúng tôi</h4>
              </div>
              <div className="contact-widget">
                <div className="cw-item">
                  <div className="ci-icon">
                    <i className="ti-location-pin"></i>
                  </div>
                  <div className="ci-text">
                    <span>Địa chỉ:</span>
                    <p>60-49 Road 11378 New York</p>
                  </div>
                </div>
                <div className="cw-item">
                  <div className="ci-icon">
                    <i className="ti-mobile"></i>
                  </div>
                  <div className="ci-text">
                    <span>Điện thoại:</span>
                    <p>+65 11.188.888</p>
                  </div>
                </div>
                <div className="cw-item">
                  <div className="ci-icon">
                    <i className="ti-email"></i>
                  </div>
                  <div className="ci-text">
                    <span>Email:</span>
                    <p>hello.colorlib@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="contact-form">
                <div className="leave-comment">
                  <h4>Để lại lời nhắn</h4>
                  <p>Nhân viên sẽ liên hệ lại và giải đáp thắc mắc cho bạn.</p>
                  <form onSubmit={handleSubmit} className="comment-form">
                  <div className="row">
                    <div className="col-lg-6">
                      <input
                        type="text"
                        name="name"
                        placeholder="Tên của bạn"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-lg-6">
                      <input
                        type="email"
                        name="email"
                        placeholder="Email của bạn"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-lg-12">
                      <input
                        type="text"
                        name="subject"
                        placeholder="Chủ đề"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-lg-12">
                      <textarea
                        name="message"
                        placeholder="Nội dung"
                        rows="5"
                        value={formData.message}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>
                    <div className="col-lg-12">
                      <button type="submit" className="site-btn">
                        Gửi tin nhắn
                      </button>
                    </div>
                  </div>
                </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Contact Section End */}

      {/* Map Section Begin */}
      <div className="map spad">
        <div className="map-inner">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1434159629457!2d-74.00601692346193!3d40.71282567138067!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a31008d9c8f%3A0x3c45af3f50a20e91!2s60-49%20Road%2C%20New%20York%2C%20NY%2011378!5e0!3m2!1sen!2sus!4v1609081555166!5m2!1sen!2sus"
            height="610"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Store Location"
          ></iframe>
          <div className="icon">
            <i className="fa fa-map-marker"></i>
          </div>
        </div>
      </div>
      {/* Map Section End */}
    </LayoutPublic>
  );
};

export default Contact;
