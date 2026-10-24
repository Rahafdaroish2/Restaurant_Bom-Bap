
                const data = {
            Meals: {
                // تم تصحيح مسار الصورة الرئيسية ليتجنب التكرار
                img: "images\primary\Spicy_Pork_Belly_Bulgogi.png.png",
                cards: [
                    {img: "images/primary/4e9554b2-e858-47a7-83f9-b0bdb6aa4246-removebg-preview.png", name: "Fruit Salad", price: "40 SAR"},
                    {img: "images/primary/Easy_Gamja_Jorim__Korean_Braised_Potatoes__-removebg-preview.png", name: "Korean Potatoes", price: "25 SAR"},
                    {img: "images/primary/Jajangmyeon__Korean_Black_Bean_Noodles_-removebg-preview.png", name: "Black Bean Noodles", price: "55 SAR"},
                    {img: "images/primary/Jjajang_Tteokbokki_is_a_classic_Korean_dish_with_-removebg-preview.png", name: "Jajang Tteokbokki", price: "60 SAR"},
                    {img: "images/primary/c15f3179-44a8-4c7b-b52e-1ac4158faebc-removebg-preview.png", name: "Spicy Bibimbap", price: "70 SAR"}
                ]
            },
            salads: {
                img: "images/salad/8fd29c0b4a77d45c463bc93887a04111-removebg-preview.png",
                cards: [
                    {img: "images/salad/8aa6339b799af237c0626bd4ada6e204-removebg-preview.png", name: "Greek Salad", price: "35 SAR"},
                    {img: "images/salad/12b9e471a39dedeade135603e738e3e8-removebg-preview.png", name: "Garden Salad", price: "30 SAR"},
                    {img: "images/salad/65bbebfe7f6520775a28576be0deb986-removebg-preview.png", name: "Caesar Salad", price: "45 SAR"},
                    {img: "images/salad/b5a0bfdb4617a9ebd76308dc0783f935-removebg-preview.png", name: "Tabbouleh", price: "20 SAR"},
                    {img: "images/salad/8fd29c0b4a77d45c463bc93887a04111-removebg-preview.png", name: "Fajita Salad", price: "50 SAR"}
                ]
            },
            desserts: {
                img: "images/dilichious/885772fd800792c2c775212da7850aed-removebg-preview.png",
                cards: [
                    {img: "images/dilichious/9d0b8ecd-ea0f-4886-a67f-d8cb9fc6031c-removebg-preview.png", name: "Cheesecake", price: "28 SAR"},
                    {img: "images/dilichious/58f82e68-3324-4b99-87ea-1fff1f8a0e52-removebg-preview.png", name: "Crepe", price: "22 SAR"},
                    {img: "images/dilichious/781bdd62-1f1e-4a51-92fc-d78dea897670-removebg-preview.png", name: "Tiramisu", price: "35 SAR"},
                    {img: "images/dilichious/8241f3b5-2bb9-4edc-98e5-eed0cb81481e-removebg-preview.png", name: "Mahalabia", price: "18 SAR"},
                    {img: "images/dilichious/791535ae-9ff4-463c-80e9-0e294cf0baee-removebg-preview.png", name: "Ice Cream", price: "15 SAR"}
                ]
            },
            drinks: {
                img: "images/drinks/80d3ec35d14f1773bb71e84e3dc5dce6-removebg-preview.png",
                cards: [
                    {img: "images/drinks/7e51b21a35fea9a9e452b825281e381d-removebg-preview.png", name: "Orange Juice", price: "15 SAR"},
                    {img: "images/drinks/105e245d18092d9b9677b2c51f0bee4d-removebg-preview.png", name: "Mango Smoothie", price: "20 SAR"},
                    {img: "images/drinks/8ffd6192e1319fcb401f7eeeee33f09e-removebg-preview.png", name: "Strawberry Juice", price: "18 SAR"},
                    {img: "images/drinks/4215835da8893a0d97f575e52ff492be-removebg-preview.png", name: "Mint Lemonade", price: "16 SAR"},
                    {img: "images/drinks/6142baf2efe5922b72d5a394817fe3ba-removebg-preview.png", name: "Mojito", price: "25 SAR"}
                ]
            },
            snacks: {
                img: "images/tram/Korean_Seafood_Pancake__Haemul_Pajeon_-removebg-preview.png",
                cards: [
                    {img: "images/tram/0d91257dd21cd7dffc358f951de37cfd-removebg-preview.png", name: "French Fries", price: "12 SAR"},
                    {img: "images/tram/00ec149ce80fa51802a3c25730725391-removebg-preview.png", name: "Mini Pizza", price: "25 SAR"},
                    {img: "images/tram/037c20f68cbaab9f9e1a8c43da2a3d78-removebg-preview.png", name: "Mini Burger", price: "30 SAR"},
                    {img: "images/tram/eb10d0fb8484eb5756aafcbf4624ad49-removebg-preview.png", name: "Chicken Croquette", price: "28 SAR"},
                    {img: "images/tram/0b2bc3879c79177d105a49305deff6cd-removebg-preview.png", name: "Nuggets", price: "20 SAR"}
                ]
            }
        };

        const mainImg = document.getElementById("main-img");
        const cardsContainer = document.getElementById("cards");
        const circles = document.querySelectorAll(".circle");
        const prevBtn = document.getElementById("prev");
        const nextBtn = document.getElementById("next");

        let currentType = "Meals";
        let startIndex = 0;
        const maxCardsToShow = 3;

        function updateNavButtons() {
            const totalItems = data[currentType].cards.length;
            
            prevBtn.classList.toggle("disabled", startIndex === 0);
            nextBtn.classList.toggle("disabled", startIndex >= totalItems - maxCardsToShow);
        }

        function renderCards() {
            const items = data[currentType].cards.slice(startIndex, startIndex + maxCardsToShow);
            cardsContainer.innerHTML = "";
            
            cardsContainer.style.opacity = 0;
            
            setTimeout(() => {
                items.forEach(item => {
                    const div = document.createElement("div");
                    div.className = "card";
                    // **تعديل الـ HTML لإضافة السعر وأيقونة الشراء**
                    div.innerHTML = `
                        <div class="card-content">
                            <img src="${item.img}" alt="${item.name}">
                            <div class="card-details">
                                <span>${item.name}</span>
                                <p>${item.price}</p> 
                            </div>
                        </div>
                        <div class="buy-icon" data-name="${item.name}">
                            <i class="fas fa-shopping-basket"></i>
                        </div>
                    `;
                    cardsContainer.appendChild(div);
                });
                cardsContainer.style.opacity = 1;
                updateNavButtons();
            }, 100);
        }

        // --- Event Listeners ---

        // Category Switch (Circles)
        circles.forEach(c => {
            c.addEventListener("click", () => {
                circles.forEach(ci => ci.classList.remove("active"));
                c.classList.add("active");
                
                currentType = c.dataset.type;
                mainImg.src = data[currentType].img;
                startIndex = 0; 
                
                renderCards();
            });
        });

        // Previous Card
        prevBtn.addEventListener("click", () => {
            if (startIndex > 0) {
                startIndex--;
                renderCards();
            }
        });

        // Next Card
        nextBtn.addEventListener("click", () => {
            const totalItems = data[currentType].cards.length;
            if (startIndex < totalItems - maxCardsToShow) {
                startIndex++;
                renderCards();
            }
        });

        // Initialize on load
        document.addEventListener('DOMContentLoaded', renderCards);

    