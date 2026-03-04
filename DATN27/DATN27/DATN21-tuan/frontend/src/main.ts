import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Hàm ẩn loading placeholder sau khi Angular bootstrap
function hideAppLoading() {
  const loadingEl = document.getElementById('app-loading');
  const appRoot = document.querySelector('app-root');
  
  if (loadingEl) {
    loadingEl.classList.add('hidden');
    // Xóa element sau khi fade out
    setTimeout(() => {
      loadingEl.remove();
    }, 300);
  }
  
  if (appRoot) {
    appRoot.classList.add('loaded');
  }
}

// Bootstrap Angular application
bootstrapApplication(App, appConfig)
  .then(() => {
    // Ẩn loading sau khi Angular bootstrap thành công
    setTimeout(hideAppLoading, 100);
  })
  .catch((err) => {
    console.error('Error bootstrapping Angular application:', err);
    // Vẫn ẩn loading ngay cả khi có lỗi để user không bị stuck
    setTimeout(hideAppLoading, 500);
  });
