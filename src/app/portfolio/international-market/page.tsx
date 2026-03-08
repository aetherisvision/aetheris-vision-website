import { Metadata } from "next";
import FadeIn from "@/components/FadeIn";
import { SITE } from "@/lib/constants";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ShoppingCartIcon,
  GlobeAltIcon,
  SparklesIcon,
  TruckIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

// Types
interface Product {
  id: number;
  name: string;
  category: Category;
  price: string;
  origin: string;
  image: string;
  inStock: boolean;
  description: string;
}

interface CulturalSection {
  title: string;
  description: string;
  color: string;
  icon: string;
}

type Category = "Asian" | "European" | "African" | "Latin American" | "Middle Eastern";

export const metadata: Metadata = {
  title: `Global Harvest Market Demo | ${SITE.name}`,
  description: "International food market demo site featuring product search, cultural sections, and online ordering system.",
  keywords: "international food, global market, specialty ingredients, cultural foods, online grocery",
  openGraph: {
    title: `Global Harvest Market - International Foods Demo | ${SITE.name}`,
    description: "Modern food market with vibrant emerald & gold design, showcasing global cuisine and cultural diversity.",
    type: "website",
  },
};

// Sample products data
const products: Product[] = [
  {
    id: 1,
    name: "Thai Jasmine Rice",
    category: "Asian",
    price: "$12.99",
    origin: "Thailand",
    image: "🌾",
    inStock: true,
    description: "Premium fragrant long-grain rice, perfect for Thai and Asian dishes."
  },
  {
    id: 2,
    name: "Italian San Marzano Tomatoes",
    category: "European",
    price: "$8.99", 
    origin: "Italy",
    image: "🍅",
    inStock: true,
    description: "Authentic DOP certified tomatoes from Mount Vesuvius region."
  },
  {
    id: 3,
    name: "Ethiopian Coffee Beans",
    category: "African",
    price: "$24.99",
    origin: "Ethiopia",
    image: "☕",
    inStock: false,
    description: "Single-origin Yirgacheffe beans with bright, floral notes."
  },
  {
    id: 4,
    name: "Mexican Vanilla Extract",
    category: "Latin American",
    price: "$16.99",
    origin: "Mexico",
    image: "🫘",
    inStock: true,
    description: "Pure vanilla extract from Veracruz, rich and complex flavor."
  },
  {
    id: 5,
    name: "French Extra Virgin Olive Oil",
    category: "European",
    price: "$19.99",
    origin: "France",
    image: "🫒",
    inStock: true,
    description: "Cold-pressed olive oil from Provence, perfect for finishing dishes."
  },
  {
    id: 6,
    name: "Indian Basmati Rice",
    category: "Asian",
    price: "$14.99",
    origin: "India",
    image: "🍚",
    inStock: true,
    description: "Aged basmati rice with distinctive aroma and long grains."
  }
];

const categories = ["All", "Asian", "European", "African", "Latin American", "Middle Eastern"] as const;

const culturalSections: CulturalSection[] = [
  {
    title: "Asian Pantry",
    description: "Essential ingredients from across Asia",
    color: "from-red-500 to-orange-500",
    icon: "🥢"
  },
  {
    title: "European Classics",
    description: "Traditional European staples and delicacies", 
    color: "from-blue-500 to-indigo-500",
    icon: "🧀"
  },
  {
    title: "African Spices",
    description: "Authentic spices and seasonings from Africa",
    color: "from-orange-500 to-red-600",
    icon: "🌶️"
  },
  {
    title: "Latin Flavors",
    description: "Vibrant ingredients from Latin America",
    color: "from-green-500 to-emerald-500", 
    icon: "🌮"
  }
];

export default function InternationalMarketDemo() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Demo Banner */}
      <div className="bg-black py-2 text-center text-xs font-semibold text-gray-300">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-blue-400 underline hover:text-blue-300">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      <main className="flex-1">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
            <FadeIn delay={0.1}>
              <div className="flex items-center gap-3 mb-4">
                <GlobeAltIcon className="h-8 w-8" />
                <h1 className="text-4xl md:text-5xl font-bold">Global Harvest Market</h1>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-xl opacity-90 mb-8 max-w-2xl">
                Discover authentic ingredients from around the world. From Asian rice to European cheeses, 
                bring global flavors to your kitchen.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <TruckIcon className="h-4 w-4" />
                  <span className="text-sm">Free shipping over $50</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <ClockIcon className="h-4 w-4" />
                  <span className="text-sm">Same-day delivery available</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <SparklesIcon className="h-4 w-4" />
                  <span className="text-sm">Authentic sourcing guaranteed</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mx-auto max-w-6xl px-6 py-8">
          <FadeIn delay={0.4}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for ingredients, spices, or products..."
                    aria-label="Search products"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select 
                    aria-label="Filter by category"
                    className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium">
                  Search
                </button>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Cultural Sections */}
        <div className="mx-auto max-w-6xl px-6 mb-12">
          <FadeIn delay={0.5}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Culture</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {culturalSections.map((section, index) => (
                <div
                  key={section.title}
                  className={`bg-gradient-to-br ${section.color} rounded-2xl p-6 text-white cursor-pointer transform hover:scale-105 transition-transform`}
                >
                  <div className="text-3xl mb-3">{section.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{section.title}</h3>
                  <p className="text-white/90 text-sm">{section.description}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Featured Products */}
        <div className="mx-auto max-w-6xl px-6 mb-12">
          <FadeIn delay={0.6}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <FadeIn key={product.id} delay={0.7 + index * 0.1}>
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl" role="img" aria-label={product.name}>{product.image}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.inStock 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                        <span className="text-sm text-gray-600">from {product.origin}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-emerald-600">{product.price}</span>
                        <button 
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                            product.inStock
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!product.inStock}
                        >
                          <ShoppingCartIcon className="h-4 w-4" />
                          {product.inStock ? 'Add to Cart' : 'Sold Out'}
                        </button>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 text-white">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <FadeIn delay={0.8}>
              <div className="text-4xl mb-4">🌍</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Taste the World from Home
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of food lovers who shop with Global Harvest Market for authentic, 
                high-quality ingredients from every corner of the globe.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                  Start Shopping
                </button>
                <button className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-800 transition-colors">
                  Sign Up for Newsletter
                </button>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mx-auto max-w-4xl px-6 mt-12">
          <FadeIn delay={0.9}>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <SparklesIcon className="h-6 w-6 text-amber-600 mx-auto mb-3" />
              <h3 className="font-bold text-amber-900 mb-2">Portfolio Demo Site</h3>
              <p className="text-amber-800 text-sm">
                This is a demonstration of an international food market website. 
                Features include product search & filtering, cultural sections, and modern e-commerce design.
              </p>
              <Link 
                href="/portfolio" 
                className="inline-block mt-4 text-amber-700 hover:text-amber-900 font-medium text-sm underline"
              >
                ← Back to Portfolio
              </Link>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}