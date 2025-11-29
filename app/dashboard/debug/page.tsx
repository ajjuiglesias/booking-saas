import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DebugPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return <div>Not authenticated</div>
  }

  // Get business by email
  const business = await prisma.business.findUnique({
    where: { email: session.user.email },
    select: { 
      id: true, 
      name: true, 
      email: true,
      slug: true,
      createdAt: true
    }
  })

  // Get all businesses
  const allBusinesses = await prisma.business.findMany({
    select: { id: true, name: true, email: true }
  })

  // Get bookings for this business
  const bookings = business ? await prisma.booking.findMany({
    where: { businessId: business.id },
    include: {
      customer: true,
      service: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  }) : []

  // Get services for this business
  const services = business ? await prisma.service.findMany({
    where: { businessId: business.id }
  }) : []

  // Get availability for this business
  const availability = business ? await prisma.availability.findMany({
    where: { businessId: business.id }
  }) : []

  // Get blocked dates for this business
  const blockedDates = business ? await prisma.blockedDate.findMany({
    where: { businessId: business.id }
  }) : []

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Information</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Session Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                userId: session.user.id,
                userEmail: session.user.email,
                userName: session.user.name,
                userSlug: (session.user as any).slug
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Business</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(business, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Businesses in System</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(allBusinesses, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Bookings ({bookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(bookings.map(b => ({
                id: b.id,
                customer: b.customer.name,
                service: b.service.name,
                startTime: b.startTime,
                status: b.status,
                businessId: b.businessId
              })), null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(services.map(s => ({
                id: s.id,
                name: s.name,
                businessId: s.businessId
              })), null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Availability ({availability.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(availability, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Blocked Dates ({blockedDates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(blockedDates, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
