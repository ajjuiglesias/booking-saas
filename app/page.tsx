import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold text-indigo-600">BookingSaaS</div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Appointment Scheduling
            <span className="block text-indigo-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The all-in-one booking platform for service-based businesses.
            Manage appointments, customers, and grow your business effortlessly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Online Booking</h3>
            <p className="text-gray-600 text-sm">
              Let customers book appointments 24/7 with your custom booking page
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Scheduling</h3>
            <p className="text-gray-600 text-sm">
              Automated availability management with buffer times and time zones
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Customer Management</h3>
            <p className="text-gray-600 text-sm">
              Keep track of customer history, notes, and booking patterns
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Instant Notifications</h3>
            <p className="text-gray-600 text-sm">
              Automatic email reminders for you and your customers
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to streamline your bookings?
          </h2>
          <p className="text-lg mb-8 text-indigo-100">
            Join hundreds of businesses managing their appointments with BookingSaaS
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 BookingSaaS. Built with Next.js and Prisma.</p>
        </div>
      </footer>
    </div>
  )
}
