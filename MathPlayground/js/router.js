/**
 * 简单的 hash-based 路由
 */
class Router {
  constructor() {
    this._routes = {};
    this._currentPath = null;
    window.addEventListener('hashchange', () => this._resolve());
  }

  // 注册路由
  register(path, handler) {
    this._routes[path] = handler;
    return this;
  }

  // 导航到指定路径
  navigate(path) {
    window.location.hash = path;
  }

  // 获取当前路径
  getCurrentPath() {
    return this._currentPath;
  }

  // 启动路由
  start() {
    this._resolve();
  }

  _resolve() {
    const hash = window.location.hash.slice(1) || '/';
    this._currentPath = hash;
    const handler = this._routes[hash];
    if (handler) {
      handler();
    } else {
      // 404 回退到首页
      const home = this._routes['/'];
      if (home) home();
    }
  }
}

const router = new Router();
