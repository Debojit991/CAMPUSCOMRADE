/* ====================
   DATA SOURCE - CAMPUS COMRADE
   ==================== */
const products = [
  // --- B2B / WHOLESALE HUB (Institutions) ---
  {
    id: 101, type: 'b2b', title: "Whiteboard Marker (Pack of 50)", category: "stationery", price: 1250, originalPrice: 1500,
    image: "https://m.media-amazon.com/images/I/81i6wMvceEL.jpg", seller: "Global Office Supplies", description: "Bullet tip markers. GST Invoice available.", moq: "2 Packs"
  },
  {
    id: 102, type: 'b2b', title: "Anatomy Lab Skeleton (Life Size)", category: "lab", price: 12000, originalPrice: 15000,
    image: "https://m.media-amazon.com/images/I/71bHtsxWZOL._AC_UF1000,1000_QL80_.jpg", seller: "MediEquip India", description: "PVC Human Skeleton Model for Biology Labs.", moq: "1 Unit"
  },
  {
    id: 103, type: 'b2b', title: "Campus Library Chairs (Set of 10)", category: "furniture", price: 18000, originalPrice: 22000,
    image: "https://5.imimg.com/data5/SELLER/Default/2024/8/440308972/XT/BD/ME/1186061/library-furniture-library-chair-500x500.jpg", seller: "AV Furniture", description: "Ergonomic study chairs with writing pad.", moq: "1 Set"
  },
   {
    id: 104,
    type: 'b2b',
    title: "Hand-Painted Lord Ganesha Idol",
    category: "Home Decor",
    price: 450,
    originalPrice: 650,
    image: "https://www.dropbox.com/scl/fi/buhf67sqqgb7gudzpdfnc/IMG_20260116_170159-1-1.jpg?rlkey=soum4rtbefhosysboraa1zb70&st=cwi29chk&raw=1",
    seller: "Divine Arts",
    description: "Vibrant orange and yellow handcrafted Ganesha statue for home altar or desk decor.",
    moq: "10 Pieces"
  },
  {
    id: 201, type: 'b2b', title: "Gold Plated Academic Medal", category: "medals&mementos", price: 150, originalPrice: 200,
    image: "https://content.jdmagicbox.com/quickquotes/images_main/gold-plated-medal-70mm-iron-802475520-dsmli0zp.jpg?impolicy=queryparam&im=Resize=(360,360),aspect=fit", 
    seller: "Trophy World", description: "Premium gold-plated medal with ribbon. Customize with student names.", moq: "1 Unit",
    isCustomizable: true 
  },
  {
    id: 202, type: 'b2b', title: "Crystal Excellence Memento", category: "medals&mementos", price: 450, originalPrice: 600,
    image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTan6XH0T3njEe4NXcrqXulyVOPzQ-9RCkNIpEU2AGq0PArqTHFcBf_A2NoO4PlrP8Bii278rzlmUddpt4P59dwTwT47RHDeglcCLe5s3YE&usqp=CAc",
    seller: "Awards India", description: "Laser engraved crystal trophy. Perfect for event winners.", moq: "1 Unit",
    isCustomizable: true
  },
  // --- STUDENT BAZAAR (P2P) ---
  {
    id: 99,
    type: 'student',
    title: "ALL IN ONE CAMPUS BOOK SET",
    category: "books",
    price: 5999,
    originalPrice: 8999,
    image: "./FRONT COVERS ALL IN ONE/id-99-img.jpeg",
    includedBooks: [
      { title: "Biology for Engineers", mrp: 479, sp: 383, frontImage: "./FRONT COVERS ALL IN ONE/biology-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/biology-back.jpeg" },
      { title: "Engineering Chemistry", mrp: 1299, sp: 1039, frontImage: "./FRONT COVERS ALL IN ONE/chemistry-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/chemistry-back.jpeg" },
      { title: "A Textbook of Electrical Tech Vol 1", mrp: 450, sp: 360, frontImage: "./FRONT COVERS ALL IN ONE/electrical1-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/electrical1-back.jpeg" },
      { title: "A Textbook of Electrical Tech Vol 2", mrp: 550, sp: 440, frontImage: "./FRONT COVERS ALL IN ONE/electrical2-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/electrical2-back.jpeg" },
      { title: "Electronics Fundamentals", mrp: 650, sp: 520, frontImage: "./FRONT COVERS ALL IN ONE/electronics-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/electronics-back.jpeg" },
      { title: "Mastering the Art of English", mrp: 650, sp: 520, frontImage: "./FRONT COVERS ALL IN ONE/english-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/english-back.jpeg" },
      { title: "B.S Grewal Higher Engineering Maths", mrp: 1179, sp: 943, frontImage: "./FRONT COVERS ALL IN ONE/maths-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/maths-back.jpeg" },
      { title: "Engineering Mechanics", mrp: 600, sp: 480, frontImage: "./FRONT COVERS ALL IN ONE/mechanics-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/mechanics-back.jpeg" },
      { title: "Engineering Physics", mrp: 695, sp: 556, frontImage: "./FRONT COVERS ALL IN ONE/physics-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/physics-back.jpeg" },
      { title: "Python for Everybody", mrp: 575, sp: 460, frontImage: "./FRONT COVERS ALL IN ONE/python-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/python-back.jpeg" },
      { title: "Programming in ANSI C", mrp: 725, sp: 580, frontImage: "./FRONT COVERS ALL IN ONE/c-all.jpeg", backImage: "./FRONT COVERS ALL IN ONE/c-back.jpeg" }
    ],
    condition: "New",
    seller: "Campus Comrade Verified",
    description: "Complete set of essential engineering books including BS Grewal, ANSI C, and BL Theraja."
  },
  {
    id: 1, type: 'student', title: "Engineering Drawing Tool Kit", category: "tools", price: 999, originalPrice: 1500,
    image: "https://m.media-amazon.com/images/I/81DGdQOisXL._AC_UF350,350_QL80_.jpg", seller: "Arjun M. (Student)", description: "Used for 1 semester. Complete set.", condition: "Brand New"
  },
  {
    id: 2, type: 'student', title: "Workshop Lab Coat (Navy)", category: "lab", price: 200, originalPrice: 300,
    image: "https://5.imimg.com/data5/SELLER/Default/2024/6/425540363/HZ/OI/TT/19725988/lab-coat.jpg?w=400", seller: "S. Roy (Student)", description: "Freshly dry-cleaned. Size M."
  },
 {
    id: 3,
    type: 'student',
    title: "Chemistry Lab Coat (Size L) - Fresh",
    category: "lab",
    price: 200,
    condition: "Like New",
    isComplete: true,
    missingItems: [],
    image: "https://rukminim2.flixcart.com/image/480/480/kw104nk0/hospital-scrub/b/s/0/unisex-lab-coat-apron-cotton-white-colour-for-medical-students-original-imag8sgsgwkebmh7.jpeg?q=90",
    seller: "S. Roy"
  }, {
    id: 4,
    type: 'student',
    title: "Hand-Painted Lord Ganesha Idol",
    category: "Home Decor",
    price: 450,
    originalPrice: 650,
    image: "https://www.dropbox.com/scl/fi/buhf67sqqgb7gudzpdfnc/IMG_20260116_170159-1-1.jpg?rlkey=soum4rtbefhosysboraa1zb70&st=cwi29chk&raw=1",
    seller: "Divine Arts",
    description: "Vibrant orange and yellow handcrafted Ganesha statue for home altar or desk decor.",
    moq: "10 Pieces"
  }
];
// Expose products to the global window
window.products = products;