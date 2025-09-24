import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { EventSlideshow } from "@/components/event-slideshow"
import { Providers } from "./providers"

export default function Home() {
  // Real event images for the slideshow
  const eventImages = [
    {
      src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      alt: "Vibrant music festival with live performances",
    },
    {
      src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      alt: "Tech conference with industry leaders",
    },
    {
      src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      alt: "Gourmet food and wine exhibition",
    },
    {
      src: "https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      alt: "Contemporary art exhibition",
    },
    {
      src: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      alt: "Major sporting event with excited fans",
    },
  ]

  // Event category images
  const categoryImages = {
    music:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    conference:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    food: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    sports:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <header className="border-b bg-primary text-primary-foreground shadow-md">
          <div className="container flex h-16 items-center justify-between">
            <div className="text-xl font-bold">EventHub</div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <section className="py-12 md:py-24 lg:py-32 bg-pattern">
            <div className="container px-4 md:px-6">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">
                      Discover and Review Amazing Events
                    </h1>
                    <p className="text-muted-foreground md:text-xl">
                      Join our platform to explore events, share your experiences, and connect with organizers.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Link href="/register">
                      <Button size="lg" className="gap-1.5 bg-primary hover:bg-primary/90 shadow-lg hover-lift">
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/events">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-secondary text-secondary hover:bg-secondary/10 hover-lift"
                      >
                        Browse Events
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mx-auto lg:ml-auto">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg border-4 border-white">
                    <Image
                      src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                      alt="Event showcase with people enjoying a concert"
                      fill
                      className="object-cover object-center animate-pulse-scale"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Event Slideshow */}
              <div className="mt-16 mb-8">
                <h2 className="text-2xl font-bold text-center mb-6 text-primary">Upcoming Featured Events</h2>
                <EventSlideshow images={eventImages} className="max-w-5xl mx-auto border-4 border-white" />
                <p className="text-center mt-4 text-muted-foreground">
                  Discover exciting events happening near you. Join us today!
                </p>
              </div>

              {/* Event Categories */}
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative group overflow-hidden rounded-lg shadow-md hover-lift">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-10"></div>
                  <Image
                    src={categoryImages.music || "/placeholder.svg"}
                    alt="Music & Concerts"
                    width={500}
                    height={300}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <h3 className="font-bold text-xl text-white">Music & Concerts</h3>
                    <p className="text-sm text-white/90 mt-2">Live performances and shows</p>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-lg shadow-md hover-lift">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-10"></div>
                  <Image
                    src={categoryImages.conference || "/placeholder.svg"}
                    alt="Conferences"
                    width={500}
                    height={300}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <h3 className="font-bold text-xl text-white">Conferences</h3>
                    <p className="text-sm text-white/90 mt-2">Business and tech events</p>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-lg shadow-md hover-lift">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-10"></div>
                  <Image
                    src={categoryImages.food || "/placeholder.svg"}
                    alt="Food & Drink"
                    width={500}
                    height={300}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <h3 className="font-bold text-xl text-white">Food & Drink</h3>
                    <p className="text-sm text-white/90 mt-2">Culinary experiences</p>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-lg shadow-md hover-lift">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-10"></div>
                  <Image
                    src={categoryImages.sports || "/placeholder.svg"}
                    alt="Sports"
                    width={500}
                    height={300}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <h3 className="font-bold text-xl text-white">Sports</h3>
                    <p className="text-sm text-white/90 mt-2">Games and competitions</p>
                  </div>
                </div>
              </div>

              {/* Testimonials section with images */}
              <div className="mt-20">
                <h2 className="text-2xl font-bold text-center mb-10 text-primary">What Our Users Say</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-md relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-secondary">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                          alt="User avatar"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="italic text-muted-foreground">
                        "This platform made finding local events so easy! I've discovered amazing concerts I would have
                        missed otherwise."
                      </p>
                      <p className="font-semibold mt-4 text-primary">Sarah J.</p>
                      <p className="text-xs text-muted-foreground">Music Enthusiast</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-secondary">
                        <Image
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                          alt="User avatar"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="italic text-muted-foreground">
                        "As an event organizer, this platform has helped me reach a wider audience and get valuable
                        feedback."
                      </p>
                      <p className="font-semibold mt-4 text-primary">Michael T.</p>
                      <p className="text-xs text-muted-foreground">Event Organizer</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-secondary">
                        <Image
                          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                          alt="User avatar"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="italic text-muted-foreground">
                        "I love being able to review events I've attended and see what others thought. It's helped me
                        find quality experiences."
                      </p>
                      <p className="font-semibold mt-4 text-primary">Priya K.</p>
                      <p className="text-xs text-muted-foreground">Food Blogger</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div className="mt-20 text-center">
                <div className="relative rounded-xl overflow-hidden">
                  <div className="absolute inset-0 z-0">
                    <Image
                      src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                      alt="Event background"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-primary/70"></div>
                  </div>
                  <div className="relative z-10 py-16 px-4 text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to Discover Amazing Events?</h2>
                    <p className="max-w-2xl mx-auto mb-8">
                      Join thousands of users who are discovering, attending, and reviewing events every day.
                    </p>
                    <Link href="/register">
                      <Button
                        size="lg"
                        className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover-lift"
                      >
                        Sign Up Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </Providers>
  )
}

