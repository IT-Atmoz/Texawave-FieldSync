import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../../lib/firebase';
import { ArrowLeft } from 'lucide-react';
import { ButtonComponent } from '../utils/ui-components';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Icon } from 'ol/style';

const TrackUserLocation = () => {
  const searchParams = useSearchParams();
  const userName = searchParams.get('userName');
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const markerFeatureRef = useRef<Feature<Point> | null>(null);

  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const [gpsStatus, setGpsStatus] = useState<'waiting' | 'active' | 'stopped'>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize OpenLayers map
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([location.lng, location.lat]),
        zoom: 15, // Initial zoom level, user can adjust manually
      }),
    });

    // Initialize vector source and layer for marker
    vectorSourceRef.current = new VectorSource();
    const markerLayer = new VectorLayer({
      source: vectorSourceRef.current,
    });
    mapInstance.current.addLayer(markerLayer);
    markerLayerRef.current = markerLayer;

    setIsMapLoading(false);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined); // Clean up on unmount
      }
    };
  }, []);

  useEffect(() => {
    if (!userName) {
      setError('Invalid or missing username');
      setGpsStatus('stopped');
      setIsMapLoading(false);
      if (vectorSourceRef.current) {
        vectorSourceRef.current.clear();
      }
      return;
    }

    const locationRef = ref(database, `users/${userName}/location`);

    const unsubscribe = onValue(
      locationRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const locData = snapshot.val();
          const latitude = parseFloat(locData.latitude);
          const longitude = parseFloat(locData.longitude);

          if (
            !isNaN(latitude) &&
            !isNaN(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
          ) {
            const newLocation = { lat: latitude, lng: longitude };
            setLocation(newLocation);
            setGpsStatus(locData.gpsActive ? 'active' : 'stopped');
            setError(null);

            const coords = fromLonLat([newLocation.lng, newLocation.lat]);

            // Update map view (center only, no zoom)
            if (mapInstance.current) {
              mapInstance.current.getView().animate({
                center: coords,
                duration: 500,
              });

              // Update or create marker
              if (vectorSourceRef.current) {
                if (!markerFeatureRef.current) {
                  // Create new marker feature
                  markerFeatureRef.current = new Feature({
                    geometry: new Point(coords),
                  });
                  markerFeatureRef.current.setStyle(
                    new Style({
                      image: new Icon({
                        src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        scale: 0.1, // Large marker
                        anchor: [0.5, 1], // Center at bottom
                        zIndex: 0, // Ensure visibility
                      }),
                    })
                  );
                  vectorSourceRef.current.addFeature(markerFeatureRef.current);
                } else {
                  // Update existing marker position
                  markerFeatureRef.current.setGeometry(new Point(coords));
                }
              }
            }
          } else {
            setLocation({ lat: 13.0827, lng: 80.2707 });
            setGpsStatus('stopped');
            setError('Invalid location data');
            if (vectorSourceRef.current) {
              vectorSourceRef.current.clear();
              markerFeatureRef.current = null;
            }
          }
        } else {
          setLocation({ lat: 13.0827, lng: 80.2707 });
          setGpsStatus('stopped');
          setError('No location data found for this user');
          if (vectorSourceRef.current) {
            vectorSourceRef.current.clear();
            markerFeatureRef.current = null;
          }
        }
      },
      (error) => {
        console.error('Failed to fetch location:', error.message);
        setGpsStatus('stopped');
        setError('Failed to fetch location: ' + error.message);
        if (vectorSourceRef.current) {
          vectorSourceRef.current.clear();
          markerFeatureRef.current = null;
        }
      }
    );

    return () => unsubscribe();
  }, [userName]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 mt-10">
      <div className="bg-white shadow-lg p-4 flex items-center sticky top-0 z-10">
        <ButtonComponent onClick={() => router.back()} variant="ghost" size="icon">
          <ArrowLeft size={24} />
        </ButtonComponent>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 ml-3 truncate flex-1">
          Track Location: {userName || 'Unknown User'}
        </h1>
      </div>
      <div className="flex-1 p-4 md:p-6 mt-6">
        {error && (
          <div className="text-center mb-4 text-red-500 font-medium text-sm md:text-base break-words">
            {error}
          </div>
        )}
        <div
          ref={mapRef}
          className={`w-full h-[60vh] md:h-[500px] bg-gray-200 relative overflow-hidden rounded-lg ${
            isMapLoading ? 'opacity-50' : 'opacity-100'
          }`}
        >
          {isMapLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-600 text-sm md:text-lg">Loading map...</span>
            </div>
          )}
        </div>
        <div className="text-center mt-4 text-sm md:text-base text-gray-600 break-words">
          {gpsStatus === 'waiting' && 'Waiting for GPS signal...'}
          {gpsStatus === 'active' && 'Live GPS tracking is active.'}
          {gpsStatus === 'stopped' && (
            <span className="text-red-500 font-medium">
              GPS tracking stopped. Last known location shown.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackUserLocation;