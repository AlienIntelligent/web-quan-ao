import React from "react";
import { useParams, Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";

const BlogDetails = () => {
  const { id } = useParams();

  const blog = {
    id: id,
    title: "What Curling Irons Are The Best Ones",
    author: "Admin",
    date: "April 23, 2026",
    category: "Fashion",
    image: "/img/blog/blog-details.jpg",
    content: `
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        `,
    relatedBlogs: [
      {
        id: 2,
        title: "Blonde Highlights Ideas For The Summer",
        image: "/img/blog/blog-2.jpg",
      },
      {
        id: 3,
        title: "How To Choose The Perfect Handbag",
        image: "/img/blog/blog-3.jpg",
      },
      {
        id: 4,
        title: "The Best Makeup Brands Reviewed",
        image: "/img/blog/blog-4.jpg",
      },
    ],
  };

  return (
    <LayoutPublic>
      {/* Breadcrumb Section Begin */}
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Chi tiết bài viết</h2>
            </div>
          </div>
        </div>
      </section>
      {/* Breadcrumb Section End */}

      {/* Blog Details Section Begin */}
      <section className="blog-details spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="blog-details-inner">
                <div className="blog-detail-title">
                  <h2>{blog.title}</h2>
                  <p>
                    {blog.category} <span>- {blog.date}</span>
                  </p>
                </div>
                <div className="blog-large-pic">
                  <img src={blog.image} alt={blog.title} />
                </div>
                <div className="blog-detail-desc">
                  {blog.content.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph.trim()}</p>
                  ))}
                </div>
                <div className="blog-quote">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    <span> - {blog.author}</span>
                  </p>
                </div>
                <div className="tag-share">
                  <div className="details-tag">
                    <ul>
                      <li><i className="fa fa-tags"></i></li>
                      <li>{blog.category}</li>
                    </ul>
                  </div>
                  <div className="blog-share">
                    <span>Chia sẻ:</span>
                    <div className="social-links">
                      <a href="#"><i className="fa fa-facebook"></i></a>
                      <a href="#"><i className="fa fa-twitter"></i></a>
                      <a href="#"><i className="fa fa-instagram"></i></a>
                      <a href="#"><i className="fa fa-pinterest"></i></a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="leave-comment">
                <h4>Để lại bình luận</h4>
                <form action="#" className="comment-form">
                  <div className="row">
                    <div className="col-lg-6">
                      <input type="text" placeholder="Ten" />
                    </div>
                    <div className="col-lg-6">
                      <input type="email" placeholder="Email" />
                    </div>
                    <div className="col-lg-12">
                      <textarea placeholder="Noi dung"></textarea>
                    </div>
                    <div className="col-lg-12">
                      <button type="submit" className="site-btn">
                        Đăng bình luận
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-3">
              <div className="blog-sidebar">
                <div className="blog-search">
                  <h4>Tìm kiếm</h4>
                  <form action="#">
                    <input type="text" placeholder="Tìm kiếm..." />
                    <button type="submit">
                      <i className="ti-search"></i>
                    </button>
                  </form>
                </div>
                <div className="blog-cat">
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
                  </ul>
                </div>
                <div className="blog-recent">
                  <h4>Bài viết mới</h4>
                  <ul>
                    <li>
                      <Link to="/blog-details/1">
                        What Curling Irons Are The Best Ones
                      </Link>
                      <span>April 23, 2026</span>
                    </li>
                    <li>
                      <Link to="/blog-details/2">
                        Blonde Highlights Ideas For The Summer
                      </Link>
                      <span>April 22, 2026</span>
                    </li>
                    <li>
                      <Link to="/blog-details/3">
                        How To Choose The Perfect Handbag
                      </Link>
                      <span>April 21, 2026</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          <div className="row mt-60">
            <div className="col-lg-12">
              <h3>Bài viết liên quan</h3>
            </div>
            {blog.relatedBlogs.map((relBlog) => (
              <div className="col-lg-4 col-md-6" key={relBlog.id}>
                <div className="blog-item">
                  <div className="bi-pic">
                    <Link to={`/blog-details/${relBlog.id}`}>
                      <img src={relBlog.image} alt={relBlog.title} />
                    </Link>
                  </div>
                  <div className="bi-text">
                    <h4>
                      <Link to={`/blog-details/${relBlog.id}`}>
                        {relBlog.title}
                      </Link>
                    </h4>
                    <Link
                      to={`/blog-details/${relBlog.id}`}
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
      </section>
      {/* Blog Details Section End */}
    </LayoutPublic>
  );
};

export default BlogDetails;
