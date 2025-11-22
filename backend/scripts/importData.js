// scripts/importData.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

// Import all products data
const products = [
  {
    title: "A2 Sahiwal Milk",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    price: "90",
    unit: "1 L",
    description: "Farm-fresh A2 milk from native Sahiwal cows.",
    fullDescription: "Our A2 Sahiwal Milk is sourced directly from our farm's native Sahiwal cows, which are raised with love and care in a natural environment. The milk is rich in nutrients, easy to digest, and perfect for daily consumption. It contains A2 protein which is considered healthier and more digestible than regular milk.",
    ingredients: "100% A2 Sahiwal cow milk. No preservatives or additives.",
    usageInstructions: "Keep refrigerated. Best consumed within 2-3 days of delivery for maximum freshness and nutrition."
  },
  {
    title: "A2 Buttermilk (200ml)",
    image: "https://www.cookwithmanali.com/masala-chaas/masala-chaas-recipe/",
    price: "10",
    unit: "Glass",
    description: "Refreshing A2 buttermilk in glass packaging.",
    fullDescription: "Our refreshing A2 Buttermilk is made from natural fermentation of A2 Sahiwal milk. It's perfect for hot summer days, aids digestion, and makes a great accompaniment to meals. This smaller size is perfect for individual consumption.",
    ingredients: "Fermented A2 Sahiwal cow milk, rock salt, cumin, curry leaves.",
    usageInstructions: "Serve chilled. Shake well before consuming. Best consumed within 1-2 days of delivery."
  },
  {
    title: "A2 Buttermilk (400ml)",
    image: "https://www.cookwithmanali.com/masala-chaas/masala-chaas-recipe/",
    price: "20",
    unit: "Bottle",
    description: "Larger size refreshing A2 buttermilk.",
    fullDescription: "Our medium-sized A2 Buttermilk is perfect for couples or small families. Made from naturally fermented A2 Sahiwal milk, it's cooling, refreshing, and aids digestion. A traditional drink that's perfect after meals or on hot days.",
    ingredients: "Fermented A2 Sahiwal cow milk, rock salt, cumin, curry leaves.",
    usageInstructions: "Serve chilled. Shake well before consuming. Best consumed within 1-2 days of delivery."
  },
  {
    title: "A2 Buttermilk (1L)",
    image: "https://www.cookwithmanali.com/masala-chaas/masala-chaas-recipe/",
    price: "40",
    unit: "Bottle",
    description: "Family size A2 buttermilk for the whole family.",
    fullDescription: "Our large 1-liter A2 Buttermilk is perfect for families or gatherings. Made from naturally fermented A2 Sahiwal milk with traditional spices, it's cooling, refreshing, and supports healthy digestion. An economical choice for regular consumers.",
    ingredients: "Fermented A2 Sahiwal cow milk, rock salt, cumin, curry leaves.",
    usageInstructions: "Serve chilled. Shake well before consuming. Best consumed within 1-2 days of delivery."
  },
  {
    title: "A2 Desi Ghee (500ml)",
    image: "https://static.toiimg.com/thumb/50026315.cms?resizemode=4&width=1200",
    price: "1600",
    unit: "Jar",
    description: "Pure A2 ghee made using the Bilona method.",
    fullDescription: "Our A2 Desi Ghee is prepared using the traditional Bilona method, which involves hand-churning cultured butter made from A2 Sahiwal cow milk. This process preserves all the natural goodness and imparts a rich aroma and flavor to the ghee. Perfect for cooking, religious ceremonies, and Ayurvedic preparations.",
    ingredients: "100% A2 Sahiwal cow milk ghee. No preservatives or additives.",
    usageInstructions: "Store in a cool, dry place. No refrigeration required. Use as a cooking medium, for tempering dishes, or as a topping for rotis and rice."
  },
  {
    title: "A2 Desi Ghee (1L)",
    image: "https://static.toiimg.com/thumb/50026315.cms?resizemode=4&width=1200",
    price: "3000",
    unit: "Jar",
    description: "Value pack pure A2 desi ghee for regular use.",
    fullDescription: "Our 1-liter A2 Desi Ghee is a value pack for regular users. Made using the traditional Bilona method from A2 Sahiwal cow milk, it has a rich aroma and flavor. It's rich in healthy fats, vitamins, and antioxidants, making it a superior choice for cooking and Ayurvedic preparations.",
    ingredients: "100% A2 Sahiwal cow milk ghee. No preservatives or additives.",
    usageInstructions: "Store in a cool, dry place. No refrigeration required. Use as a cooking medium, for tempering dishes, or as a topping for rotis and rice."
  },
  {
    title: "A2 Paneer",
    image: "https://twosleevers.com/wp-content/uploads/2017/06/Instant-Pot-Paneer-01.jpg",
    price: "350",
    unit: "250g",
    description: "Fresh homemade paneer from A2 Sahiwal milk.",
    fullDescription: "Our A2 Paneer is freshly made from pure A2 Sahiwal cow milk. It's soft, creamy, and perfect for various Indian dishes. The paneer is made without any additives or preservatives, ensuring you get the authentic taste and all the nutritional benefits of A2 milk.",
    ingredients: "100% A2 Sahiwal cow milk, food-grade citric acid.",
    usageInstructions: "Keep refrigerated. Use within 2-3 days of delivery for maximum freshness. Ideal for curries, stir-fries, and stuffed dishes."
  },
  {
    title: "A2 Butter",
    image: "https://media.istockphoto.com/id/1338222224/photo/butter-blocks-and-pieces-on-wooden-table-copy-space.jpg?s=612x612&w=0&k=20&c=65ZYwALchrY4iXYkfrchnnWKCpuP20TZvXnSSmWnBPM=",
    price: "220",
    unit: "200g",
    description: "Premium hand-churned butter from A2 milk.",
    fullDescription: "Our A2 Butter is hand-churned from cream extracted from A2 Sahiwal cow milk. It has a rich, creamy texture and natural sweetness that store-bought butter can't match. Free from additives and preservatives, this butter is perfect for spreading on bread, cooking, or making desserts.",
    ingredients: "Cream from A2 Sahiwal cow milk. No salt, preservatives, or additives.",
    usageInstructions: "Keep refrigerated. Best consumed within 7-10 days of delivery. Use as a spread, for cooking, or in baking."
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    importData();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

const importData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany();
    
    // Insert new data
    await Product.insertMany(products);
    
    console.log('Data imported successfully!');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};