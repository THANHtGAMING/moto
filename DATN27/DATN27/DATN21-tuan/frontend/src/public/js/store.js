// js/riders.js
document.addEventListener("DOMContentLoaded", () => {
  const ridersTrack = document.querySelector(".riders-track");
  const prevBtn = document.querySelector(".riders-btn.prev");
  const nextBtn = document.querySelector(".riders-btn.next");

  if (!ridersTrack || !prevBtn || !nextBtn) return;

  nextBtn.addEventListener("click", () => {
    ridersTrack.scrollBy({ left: 300, behavior: "smooth" });
  });

  prevBtn.addEventListener("click", () => {
    ridersTrack.scrollBy({ left: -300, behavior: "smooth" });
  });
});

// js/slider.js
document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".slider-track");
  const btnPrev = document.querySelector(".slider-btn.prev");
  const btnNext = document.querySelector(".slider-btn.next");

  if (!track || !btnPrev || !btnNext) return;

  btnNext.addEventListener("click", () => {
    track.scrollBy({ left: 300, behavior: "smooth" });
  });

  btnPrev.addEventListener("click", () => {
    track.scrollBy({ left: -300, behavior: "smooth" });
  });
});



// ctsp
// ----- Image Slide -----

const images = [
  "/public/image/ao1.3.avif",
  "/public/image/ao1.2.avif"
];
let current = 0;

function showImage(i) {
  current = i;
  const img = document.getElementById("mainProductImg");
  img.style.opacity = 0; // fade out
  setTimeout(() => {
    img.src = images[i];
    img.style.opacity = 1; // fade in
  }, 200);
  document.querySelectorAll(".thumbs img").forEach((thumb, idx) => {
    thumb.classList.toggle("active", idx === i);
  });
}

function nextImage() {
  current = (current + 1) % images.length;
  showImage(current);
}

function prevImage() {
  current = (current - 1 + images.length) % images.length;
  showImage(current);
}


// ----- Modal -----
function openModal() {
  document.getElementById("sizeModal").style.display = "block";
}

function closeModal() {
  document.getElementById("sizeModal").style.display = "none";
}

window.onclick = function(e) {
  const modal = document.getElementById("sizeModal");
  if (e.target === modal) modal.style.display = "none";
};

// ----- Dropdown -----
function toggleDrop(header) {
  const content = header.nextElementSibling;
  const open = content.style.display === "block";
  document.querySelectorAll(".drop-content").forEach(c => c.style.display = "none");
  document.querySelectorAll(".drop-header span").forEach(s => s.textContent = "+");
  if (!open) {
    content.style.display = "block";
    header.querySelector("span").textContent = "–";
  }
}

document.querySelectorAll('.dropdown').forEach(drop => {
  const header = drop.querySelector('.drop-header');
  const content = drop.querySelector('.drop-content');
  const toggle = drop.querySelector('.toggle');

  header.addEventListener('click', () => {
    const isOpen = content.classList.toggle('show');
    header.classList.toggle('active', isOpen);
    toggle.textContent = isOpen ? '–' : '+';
  });
});

// product.html
// demo lọc checkbox
document.querySelectorAll(".sidebar input[type='checkbox']").forEach(cb => {
  cb.addEventListener("change", () => {
    console.log("Filter:", cb.parentElement.textContent.trim());
  });
});


// giỏ hàng ///////////////////////////////////////////////////
// 1. (mở/đóng phần nhập mã giảm giá)
document.querySelector('.promo-header').addEventListener('click', () => {
  const promo = document.querySelector('.promo-content');
  const toggle = document.querySelector('.promo-header .toggle');
  const isOpen = promo.style.display === 'block';
  promo.style.display = isOpen ? 'none' : 'block';
  toggle.textContent = isOpen ? '+' : '–';
});
// ấn nút add to cart qua cart
  