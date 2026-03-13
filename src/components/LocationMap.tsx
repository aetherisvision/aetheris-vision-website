"use client";

import { useState } from "react";
import { MapPinIcon, ArrowTopRightOnSquareIcon, PhoneIcon, ClockIcon } from "@heroicons/react/24/outline";

interface LocationMapProps {
  businessName: string;
  address: string;
  phone: string;
  hours: string;
  embedUrl?: string;
  className?: string;
}

export default function LocationMap({ 
  businessName, 
  address, 
  phone, 
  hours, 
  embedUrl,
  className = "" 
}: LocationMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Default to OKC area if no embed URL provided
  const defaultEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3245.123456789!2d-97.5164!3d35.4676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDI4JzAzLjQiTiA5N8KwMzAnNTkuMCJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus";
  
  const mapSrc = embedUrl || defaultEmbedUrl;
  
  // Generate directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Map Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
        <div className="flex items-center gap-3">
          <MapPinIcon className="h-6 w-6 text-amber-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{businessName}</h3>
            <p className="text-sm text-gray-600">{address}</p>
          </div>
        </div>
      </div>
      
      {/* Interactive Map */}
      <div className="relative">
        <iframe
          src={mapSrc}
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${businessName} Location Map`}
          onLoad={() => setIsLoaded(true)}
          className="w-full"
        />
        
        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-amber-600"></div>
              <span className="text-sm">Loading map...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Business Info & Actions */}
      <div className="p-6 space-y-4">
        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Call Us</p>
              <a 
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="text-amber-600 hover:text-amber-700 transition-colors"
              >
                {phone}
              </a>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Hours</p>
              <p className="text-gray-600">{hours}</p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Get Directions
          </a>
          
          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <PhoneIcon className="h-4 w-4" />
            Call Now
          </a>
        </div>
        
        {/* Service Area Note */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            📍 Proudly serving the Greater Oklahoma City Metro Area
          </p>
        </div>
      </div>
    </div>
  );
}