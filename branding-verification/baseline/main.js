(function(){
  const cards = document.querySelectorAll('.card');
  const heroImg = document.getElementById('heroImage');

  // helper to animate change
  function changeImage(newSrc){
    // current img anim out
    heroImg.classList.add('anim-out');

    // بعد ما تخلص حركة الخروج نغير الصورة
    setTimeout(() => {
      heroImg.src = newSrc;
      // force reflow to reset transition
      void heroImg.offsetWidth;
      heroImg.classList.remove('anim-out');
      heroImg.classList.add('anim-in');

      // تنظيف بعد الانيميشن
      setTimeout(()=>{
        heroImg.classList.remove('anim-in');
      }, 900);
    }, 240);
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      // mark active
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      // نجيب src من <img> جوّا الكارد
      const imgEl = card.querySelector("img");
      if (imgEl && imgEl.src){
        changeImage(imgEl.src);
      }
    });

    // keyboard accessible
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); card.click();
      }
    });
  });

  // hover tilt effect
  cards.forEach(c=>{
    c.addEventListener('mousemove', (ev)=>{
      const r = c.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      c.style.transform = `translateY(-6px) rotateX(${ -y * 3 }deg) rotateY(${ x * 4 }deg) scale(1.03)`;
    });
    c.addEventListener('mouseleave', ()=>{
      if (!c.classList.contains('active')) {
        c.style.transform = '';
      } else {
        c.style.transform = 'translateY(-10px) scale(1.04)';
      }
    });
  });

})();

   const featuredDishesData = {
  salads: [
    { name: "Mix Salad", desc: "Mix Vegetables", price: 24, img: "images/salad/13e329eaebcd07f93afd970b9ce39bfe.jpg" },
    { name: "Quinoa Salad", desc: "Spicy with Garlic", price: 22, img: "images/salad/eb9ba1a332c639394b8b588f2b40edf4.jpg" },
    { name: "Greek Salad", desc: "Feta & Olives", price: 26, img: "images/salad/ba2d6f1da0d7a26e0a0de654e00c3a14.jpg" },
    { name: "Caesar Salad", desc: "Classic Dressing", price: 25, img: "images/salad/b5a0bfdb4617a9ebd76308dc0783f935.jpg" }
  ],
  desserts: [
    { name: "Chocolate Cake", desc: "Dark & Sweet", price: 18, img: "images/dilichious/47dcc971-1d02-43df-bc4c-13107d3d6b5c.jpeg" },
    { name: "Cheesecake", desc: "Creamy & Fresh", price: 20, img: "images/dilichious/58f82e68-3324-4b99-87ea-1fff1f8a0e52.jpeg" },
    { name: "Cupcake", desc: "Vanilla & Frosting", price: 12, img: "images/dilichious/781bdd62-1f1e-4a51-92fc-d78dea897670.jpeg" },
    { name: "Brownie", desc: "Chocolatey & Fudgy", price: 15, img: "images/dilichious/Beet Songpyeon.jpeg" }
  ],
  drinks: [
    { name: "Orange Juice", desc: "Freshly Squeezed", price: 10, img: "images/drinks/1bb0e9f8e5749eee1a35548efbeaa2ed.jpg" },
    { name: "Lemonade", desc: "Cool & Refreshing", price: 8, img: "images/drinks/ada3b20cdb495b282c7c7b6965acb505.jpg" },
    { name: "Iced Tea", desc: "Mint & Lemon", price: 9, img: "images/drinks/aa71b16c0edcb3a645727addaeb930df.jpg" },
    { name: "Coffee", desc: "Hot & Strong", price: 11, img: "images/drinks/e84482bf8e0bc58e06ffe16f800cc43b.jpg" }
  ],
  meals: [
    { name: "Burger", desc: "Beef & Cheese", price: 30, img: "images/primary/Here's how you could share a recipe for Kimbap on….jpeg" },
    { name: "Pizza", desc: "Pepperoni & Cheese", price: 35, img: "images/primary/Spicy Pork Belly Bulgogi _ The Subversive Table.jpeg" },
    { name: "Pasta", desc: "Tomato & Basil", price: 28, img: "images/primary/Kimchi Jjigae (Kimchi Stew) – Takes Two Eggs.jpeg" },
    { name: "Grilled Chicken", desc: "Herbs & Spices", price: 32, img: "images/primary/be65c909-59d2-4bd2-b157-94bf75d88f15.jpeg" }
  ]
};

const cardsContainer = document.getElementById("featured-dishes-cards");
const categoryBtns = document.querySelectorAll(".featured-dishes-category-btn");

// عرض الكروت
function showFeaturedDishes(category) {
  cardsContainer.innerHTML = ""; 
  featuredDishesData[category].forEach(item => {
    const card = document.createElement("div");
    card.className = "featured-dishes-card";
    card.style.backgroundImage = `url('${item.bg}')`; // الخلفية
    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <p>
        <span class="featured-dishes-price">$${item.price}</span>
        <span class="featured-dishes-heart">&#10084;</span>
      </p>
    `;
    cardsContainer.appendChild(card);

    // زر القلب
    card.querySelector(".featured-dishes-heart").addEventListener("click", function () {
      this.classList.toggle("active");
    });
  });
}

// تبديل القسم
categoryBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".featured-dishes-category-btn.active").classList.remove("active");
    btn.classList.add("active");
    showFeaturedDishes(btn.getAttribute("data-category"));
  });
});

// أول تحميل
showFeaturedDishes("salads");


 document.querySelectorAll('.reviews-photo img').forEach(img => {
    const original = img.getAttribute('src');     // الصورة الأولى
    const alternate = img.getAttribute('data-alt'); // الصورة الثانية
    let toggled = false;

    setInterval(() => {
      img.src = toggled ? original : alternate;
      toggled = !toggled;
    }, 3000); // كل 3 ثواني يبدل
  });
  document.addEventListener("DOMContentLoaded", () => {
const cards = document.querySelectorAll(".reviews-card");

function revealOnScroll() {
const trigger = window.innerHeight * 0.85;
cards.forEach((card, i) => {
const rect = card.getBoundingClientRect();
if (rect.top < trigger) {
setTimeout(() => {
card.classList.add("show");
}, i * 200); // stagger بين الكروت
}
});
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();
});
