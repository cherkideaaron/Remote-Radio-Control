import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Radio, Antenna, Globe, Users, Zap, Headphones } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">ET3AA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>
          <Link href="/login">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Station Access</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary">Live Remote Station</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance">
            Ethiopian Amateur
            <br />
            <span className="text-primary">Radio Society</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            Connect with the world from Addis Ababa. Our remote station allows licensed operators to access HF bands and
            communicate globally through ET3AA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Access Remote Station
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border hover:bg-secondary bg-transparent">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1962</div>
              <div className="text-sm text-muted-foreground">Established</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">150+</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">8</div>
              <div className="text-sm text-muted-foreground">HF Bands</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Station Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Remote Station Features</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Full control over our HF station from anywhere in the world
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Radio className="w-6 h-6" />}
              title="Multi-Band Operation"
              description="Access 80m through 6m bands with instant band switching and preset frequencies"
            />
            <FeatureCard
              icon={<Antenna className="w-6 h-6" />}
              title="Rotatable Antenna"
              description="Full 360° antenna rotation with real-time compass display for directional control"
            />
            <FeatureCard
              icon={<Headphones className="w-6 h-6" />}
              title="Live Audio Stream"
              description="High-quality audio streaming with adjustable volume and mute controls"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Multiple Modes"
              description="Support for LSB, USB, AM, CW, FM, RTTY, and Data modes"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Global Reach"
              description="Strategic location in Addis Ababa provides excellent propagation to all continents"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Community"
              description="Join a vibrant community of amateur radio enthusiasts across Ethiopia"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-card/50 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">About ET3AA</h2>
              <p className="text-muted-foreground mb-4">
                The Ethiopian Amateur Radio Society (EARS) has been promoting amateur radio in Ethiopia since 1962. Our
                club station ET3AA is located in Addis Ababa and serves as the primary gateway for Ethiopian amateur
                radio operators to connect with the global ham community.
              </p>
              <p className="text-muted-foreground mb-6">
                With this remote station project, we aim to provide 24/7 access to our facilities, allowing licensed
                operators to make contacts from anywhere with an internet connection.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 rounded-lg bg-secondary">
                  <div className="text-sm text-muted-foreground">Call Sign</div>
                  <div className="text-lg font-bold text-primary">ET3AA</div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-secondary">
                  <div className="text-sm text-muted-foreground">Grid Square</div>
                  <div className="text-lg font-bold text-primary">KJ38</div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-secondary">
                  <div className="text-sm text-muted-foreground">CQ Zone</div>
                  <div className="text-lg font-bold text-primary">37</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-xl bg-secondary border border-border overflow-hidden">
                <img
                  src="/et3aa.jpg"
                  alt="ET3AA Radio Station"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Radio className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Get On Air?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Licensed operators can access the remote station now. Login with your credentials to start operating.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              Login to Station
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 border-t border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold text-foreground">ET3AA</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ethiopian Amateur Radio Society
                <br />
                Addis Ababa, Ethiopia
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <p className="text-sm text-muted-foreground">
                Email: et3aastation@gmail.com
                <br />
                QRZ: ET3AA
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Links</h3>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  IARU Region 1
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  QRZ.com
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ARRL
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © 2025 Ethiopian Amateur Radio Society. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
