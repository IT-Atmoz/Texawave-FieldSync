"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    console.log("Theme loaded:", storedTheme);
    setTheme(storedTheme);
  }, []);

  return (
    <main
      className={`bg-background text-foreground ${
        theme === "dark" ? "dark" : ""
      } px-6 py-12 sm:px-12 md:px-24 max-w-6xl mx-auto font-sans`}
    >
      <section className="mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">FieldSync Help Center</h1>
        <p className="text-lg">
          Everything you need to understand, navigate, and make the best use of FieldSync.
        </p>
      </section>

      {/* What is FieldSync */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">What is FieldSync?</h2>
        <p className="text-base leading-relaxed">
          FieldSync is an all-in-one construction project management software built for real
          estate builders, construction firms, and contractors. It helps you manage your sites,
          track employees, control costs, store important documents, and generate client reports
          — all in one place. It's trusted by certified firms and runs on Google Firebase’s
          secure cloud with AES-encrypted data.
        </p>
      </section>

      {/* Feature Guide */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6">Feature Guide (A-Z)</h2>

        <ul className="space-y-6">
          <li>
            <strong>Dashboard:</strong> Your main overview. See total projects, today’s activities,
            pending tasks, and quick links.
          </li>
          <li>
            <strong>Projects:</strong> Add/manage multiple active construction sites. Update site
            status, assign engineers, and track phase-wise progress.
          </li>
          <li>
            <strong>Employees:</strong> View all active and inactive workers and staff. Manage roles
            and site assignments.
          </li>
          <li>
            <strong>Employee Details:</strong> Full profile, contact info, documents of each worker.
          </li>
          <li>
            <strong>Attendance:</strong> Daily logs using mobile GPS check-in with timestamps.
          </li>
          <li>
            <strong>Salary Management:</strong> Auto-calculated salary based on attendance with
            export options.
          </li>
          <li>
            <strong>Materials:</strong> Track stock, requests, spending, and inventory site-wise.
            <ul className="list-disc ml-6 mt-2">
              <li>
                <strong>Requests:</strong> New item requests and approval tracking.
              </li>
              <li>
                <strong>Inventory:</strong> View all item quantities site-wise.
              </li>
              <li>
                <strong>Spending:</strong> Summary of money spent and item purchases.
              </li>
            </ul>
          </li>
          <li>
            <strong>Tasks:</strong> Assign, monitor, and complete engineer/worker tasks.
          </li>
          <li>
            <strong>Chat Employees:</strong> Internal chat for instant communication.
          </li>
          <li>
            <strong>Shifts Management:</strong> Assign shifts (Day/Night) and manage manpower
            rotation.
          </li>
          <li>
            <strong>Reports:</strong> Auto-generated PDFs for attendance, salary, materials,
            projects, and more.
          </li>
          <li>
            <strong>Leaves:</strong> Apply, approve, and view leave history.
          </li>
          <li>
            <strong>Invoice:</strong> Create invoices linked to project timelines and materials.
          </li>
          <li>
            <strong>Work History:</strong> View historical logs of site activities.
          </li>
          <li>
            <strong>Location Tracking:</strong> GPS tracking of employee check-in locations.
          </li>
          <li>
            <strong>Documents:</strong> Upload PDFs, IDs, contracts, site approvals.
          </li>
          <li>
            <strong>Drawings:</strong> View building plans, blueprints, and engineering drawings.
          </li>
          <li>
            <strong>Client Portal:</strong> External view for clients to see progress, photos, and invoices.
          </li>
        </ul>
      </section>

      {/* Contact Form */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6">Need Help or Have a Question?</h2>
        <form className="space-y-6 max-w-xl">
          <Input
            type="text"
            placeholder="Your Name"
            required
            className={theme === "dark" ? "text-foreground bg-input" : ""}
          />
          <Input
            type="email"
            placeholder="Your Email"
            required
            className={theme === "dark" ? "text-foreground bg-input" : ""}
          />
          <Input
            type="tel"
            placeholder="Your Phone Number"
            required
            className={theme === "dark" ? "text-foreground bg-input" : ""}
          />
          <Textarea
            rows={5}
            placeholder="Your Message"
            required
            className={theme === "dark" ? "text-foreground bg-input" : ""}
          />
          <Button
            type="submit"
            className={`w-full rounded-full text-md ${
              theme === "dark"
                ? "bg-primary text-primary-foreground hover:bg-secondary"
                : "bg-primary-foreground text-primary hover:bg-gray-900"
            }`}
          >
            Submit Inquiry
          </Button>
        </form>
      </section>

      {/* Footer Branding */}
      <footer className="text-center text-sm">
        © 2025 Clicky Technologies – Built with Firebase Security
      </footer>
    </main>
  );
}
