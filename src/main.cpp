#include <iostream>
#include <fstream>
#include <sstream>
#include <queue>
#include <optional>
#include <vector>
#include <thread>
#include <future>
#include <condition_variable>
#include <atomic>
#include <functional>
#include "httplib.h"
#include "nlohmann/json.hpp"

using json = nlohmann::json;
using namespace httplib;

static std::string read_file(const std::string &path) {
  std::ifstream ifs(path, std::ios::in | std::ios::binary);
  if (!ifs) return {};
  std::ostringstream ss;
  ss << ifs.rdbuf();
  return ss.str();
}

// Simple thread pool with bounded queue
class SimpleThreadPool {
public:
  SimpleThreadPool(size_t threads = 0, size_t max_q = 256) : stop_(false), max_queue_(max_q) {
    if (threads == 0) threads = std::max<size_t>(1, std::thread::hardware_concurrency());
    for (size_t i = 0; i < threads; ++i) {
      workers_.emplace_back([this] {
        for (;;) {
          std::function<void()> task;
          {
            std::unique_lock<std::mutex> lock(this->queue_mutex_);
            this->cond_var_.wait(lock, [this] { return this->stop_ || !this->tasks_.empty(); });
            if (this->stop_ && this->tasks_.empty()) return;
            task = std::move(this->tasks_.front());
            this->tasks_.pop();
          }
          task();
        }
      });
    }
  }

  ~SimpleThreadPool() {
    {
      std::unique_lock<std::mutex> lock(queue_mutex_);
      stop_ = true;
    }
    cond_var_.notify_all();
    for (auto &w : workers_) if (w.joinable()) w.join();
  }

  // Submit a task; returns optional future. If queue is full, returns nullopt.
  template <class F, class... Args>
  auto submit(F &&f, Args &&... args) -> std::optional<std::future<std::invoke_result_t<F, Args...>>> {
    using return_type = std::invoke_result_t<F, Args...>;
    auto task_ptr = std::make_shared<std::packaged_task<return_type()>>(
        std::bind(std::forward<F>(f), std::forward<Args>(args)...));

    std::future<return_type> res = task_ptr->get_future();
    {
      std::unique_lock<std::mutex> lock(queue_mutex_);
      if (tasks_.size() >= max_queue_) {
        return std::nullopt;
      }
      tasks_.emplace([task_ptr]() { (*task_ptr)(); });
    }
    cond_var_.notify_one();
    return std::optional<std::future<return_type>>(std::move(res));
  }

private:
  std::vector<std::thread> workers_;
  std::queue<std::function<void()>> tasks_;
  std::mutex queue_mutex_;
  std::condition_variable cond_var_;
  std::atomic<bool> stop_;
  size_t max_queue_;
};

int main() {
  Server svr;

  // Serve static files from public/
  svr.set_mount_point("/", "public");

  // Thread pool for CPU-bound JSON formatting work
  SimpleThreadPool pool(/*threads=*/std::max<size_t>(2, std::thread::hardware_concurrency()), /*max_q=*/512);

  svr.Post("/format", [&pool](const Request &req, Response &res) {
    const size_t MAX_BODY = 5 * 1024 * 1024; // 5 MB
    if (req.body.size() > MAX_BODY) {
      res.status = 413;
      res.set_content("Payload too large", "text/plain");
      return;
    }

    std::string body = req.body;

    // Submit parsing/formatting to thread pool
    auto fut_opt = pool.submit([body]() -> std::pair<int, std::string> {
      try {
        json j = json::parse(body);
        std::string out = j.dump(4);
        return {200, out};
      } catch (const std::exception &e) {
        json err;
        err["error"] = e.what();
        return {400, err.dump()};
      }
    });

    if (!fut_opt.has_value()) {
      res.status = 503;
      res.set_content("Server busy", "text/plain");
      return;
    }

    auto fut = std::move(*fut_opt);
    auto pr = fut.get();
    res.status = pr.first;
    if (pr.first == 200) {
      res.set_content(pr.second, "application/json; charset=utf-8");
    } else {
      res.set_content(pr.second, "application/json; charset=utf-8");
    }
  });

  std::cout << "Starting server at http://0.0.0.0:8080" << std::endl;
  svr.listen("0.0.0.0", 8080);
  return 0;
}
