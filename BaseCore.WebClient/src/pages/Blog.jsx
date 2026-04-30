import React from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";

const Blog = () => {
  const blogs = [
    {
      id: 1,
      title: "What Curling Irons Are The Best Ones",
      author: "Admin",
      date: "April 23, 2026",
      category: "Fashion",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: "/img/blog/blog-1.jpg",
    },
    {
      id: 2,
      title: "Blonde Highlights Ideas For The Summer",
      author: "Admin",
      date: "April 23, 2026",
      category: "Lifestyle",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: "/img/blog/blog-2.jpg",
    },
    {
      id: 3,
      title: "How To Choose The Perfect Handbag",
      author: "Admin",
      date: "April 23, 2026",
      category: "Accessories",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: "/img/blog/blog-3.jpg",
    },
    {
      id: 4,
      title: "The Best Makeup Brands Reviewed",
      author: "Admin",
      date: "April 23, 2026",
      category: "Beauty",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: "/img/blog/blog-4.jpg",
    },
    {
      id: 5,
      title: "Fashion Trends For This Season",
      author: "Admin",
      date: "April 23, 2026",
      category: "Fashion",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: "/img/blog/blog-5.jpg",
    },
    {
      id: 6,
      title: "Spring Shoe Collection Release",
      author: "Admin",
      date: "April 23, 2026",
      category: "Shoes",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: "/img/blog/blog-6.jpg",
    },
  ];

  return (
    <LayoutPublic>
      {/* Breadcrumb Section Begin */}
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Tin tức</h2>
            </div>
          </div>
        </div>
      </section>
      {/* Breadcrumb Section End */}

      {/* Blog Section Begin */}
      <section className="blog-section spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-sm-8">
              <div className="blog-sidebar">
                <div className="search-form">
                  <h4>Tìm kiếm</h4>
                  <form action="#">
                    <input type="text" placeholder="Tìm kiếm..." />
                    <button type="submit">
                      <i className="ti-search"></i>
                    </button>
                  </form>
                </div>
                <div className="blog-catagory">
                  <h4>Danh mục</h4>
                  <ul>
                    <li>
                      <a href="#">Fashion (20)</a>
                    </li>
                    <li>
                      <a href="#">Lifestyle (15)</a>
                    </li>
                    <li>
                      <a href="#">Accessories (10)</a>
                    </li>
                    <li>
                      <a href="#">Beauty (8)</a>
                    </li>
                    <li>
                      <a href="#">Shoes (12)</a>
                    </li>
                  </ul>
                </div>
                <div className="recent-post">
                  <h4>Bài viết mới</h4>
                  <div className="recent-blog">
                    {blogs.slice(0, 3).map((blog) => (
                      <Link className="rb-item" key={blog.id} to={`/blog-details/${blog.id}`}>
                        <div className="rb-pic">
                          <img src={blog.image} alt={blog.title} />
                        </div>
                        <div className="rb-text">
                          <h6>{blog.title}</h6>
                          <p>{blog.date}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-9 col-md-6 col-sm-8">
              <div className="row">
                {blogs.map((blog) => (
                  <div className="col-lg-6 mb-30" key={blog.id}>
                    <div className="blog-item">
                      <div className="bi-pic">
                        <Link to={`/blog-details/${blog.id}`}>
                          <img src={blog.image} alt={blog.title} />
                        </Link>
                      </div>
                      <div className="bi-text">
                        <a href="#" className="blog-cat-tag">
                          {blog.category}
                        </a>
                        <h4>
                          <Link to={`/blog-details/${blog.id}`}>
                            {blog.title}
                          </Link>
                        </h4>
                        <div className="blog-meta">
                          <span>bởi</span>
                          <a href="#">{blog.author}</a>
                          <span>|</span>
                          <a href="#">{blog.date}</a>
                        </div>
                        <p>{blog.excerpt}</p>
                        <Link
                          to={`/blog-details/${blog.id}`}
                          className="read-more"
                        >
                          Xem thêm
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Blog Section End */}
    </LayoutPublic>
  );
};

export default Blog;
