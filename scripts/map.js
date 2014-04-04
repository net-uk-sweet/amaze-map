(function(window, $, _, google) {
      /* globals jQuery, _, google, InfoBox */

      'use strict';

      var mapOptions = {
            center: new google.maps.LatLng(45, 0),
            zoom: 2,
            // http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html?utm_medium=twitter
            styles: [
                  {
                        'featureType': 'landscape.natural.terrain',
                        'stylers': [
                              { 'visibility': 'off' }
                        ]
                  }, 
                  {
                        'featureType': 'landscape.natural.landcover',
                        'stylers': [
                              { 'visibility': 'on' }, 
                              { 'color': '#f0eae5' }
                        ]
                  }, 
                  {
                        'featureType': 'water',
                        'stylers': [
                              { 'visibility': 'on' }, 
                              { 'color': '#f9f7f7' }
                        ]
                  }, 
                  {
                        'featureType': 'administrative.country',
                        'elementType': 'geometry.stroke',
                        'stylers': [
                              { 'color': '#f7f7f7' }, 
                              { 'visibility': 'on' }, 
                              { 'weight': 1 }
                        ]
                  }, 
                  {
                        'featureType': 'administrative.country',
                        'elementType': 'labels.text',
                        'stylers': [
                              { 'visibility': 'off' }
                        ]
                  }, 
                  {
                        'featureType': 'administrative.country',
                        'elementType': 'labels.icon',
                        'stylers': [
                              { 'visibility': 'off' }
                        ]
                  }
            ]
      };

      // Defines the order in which markers are created
      var locationTypes = [
            'head',
            'regional',
            'international',
            'alliance'
      ];

      var colors = {
            head: 'a8ccbe',
            regional: 'fdc617',
            international: 'b65a19',
            alliance: 'ee7206'
      };

      var locations = [
            { 
                  name: 'London',
                  position: new google.maps.LatLng(51.513704, -0.132957),
                  type: 'head'
            },
            { 
                  name: 'Liverpool',
                  position: new google.maps.LatLng(53.405979, -2.995882),
                  type: 'regional'
            },
            { 
                  name: 'Manchester',
                  position: new google.maps.LatLng(53.472816, -2.246508),
                  type: 'regional'
            },
            { 
                  name: 'Brussels',
                  position: new google.maps.LatLng(50.823572, 4.376693),
                  type: 'regional'
            },
            { 
                  name: 'Chicago',
                  position: new google.maps.LatLng(41.878114, -87.629798),
                  type: 'international'
            },
            { 
                  name: 'New York',
                  position: new google.maps.LatLng(40.714353, -74.005973),
                  type: 'international'
            },
            { 
                  name: 'Singapore',
                  position: new google.maps.LatLng(1.290988, 103.847302),
                  type: 'international'
            },
            { 
                  name: 'Shanghai',
                  position: new google.maps.LatLng(31.230416, 121.473701),
                  type: 'international'
            },
            { 
                  name: 'Tokyo',
                  position: new google.maps.LatLng(35.689487, 139.691706),
                  type: 'alliance'
            },
            { 
                  name: 'Sydney',
                  position: new google.maps.LatLng(-33.867487, 151.206990),
                  type: 'alliance'
            },
      ];

      var map, markers = [], introDuration = 7500;
      var $amazeMap = $('.amaze-map');

      function initialize() {
            
            map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

            _.forEach(locationTypes, function(type, i) {
                  // Group the locations by type and stagger creation
                  setTimeout(function() {
                        showButton(type);
                        createMarkers(getLocationsByType(type));
                  }, getPauseDuration(i));
            });            

            // Natural earth data from :-
            // https://www.google.com/fusiontables/DataSource?dsrcid=423734#rows:id=1
            var layer = new google.maps.FusionTablesLayer({
                  map: map,
                  heatmap: { enabled: false },
                  query: {
                        select: 'kml_4326',
                        from: '424206', 
                        /*where: 'iso_a3 not in (\x27AFG\x27, \x27MEX\x27, \x27USA\x27, \x27JPN\x27)'*/
                        where: "name_sort not in ('Guyana', 'Suriname', 'Greenland', 'Western Sahara', 'Mauritania', 'Mali', 'Senegal', 'Guinea-Bissau', 'Guinea', 'The Gambia', 'Sierra Leone', 'Liberia', 'Niger', 'Chad', 'Namibia', 'Botswana', 'Ethopia', 'Somalia', 'Madagascar', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Afghanistan', 'Mongolia', 'Myanmar', 'Laos', 'Cambodia', 'Papua New Guinea')"
                  },
                  styles: [{
                        polygonOptions: {
                              fillColor: '#f2b37a',
                              fillOpacity: 0.5,
                              strokeColor: '#f7f7f7',
                              strokeWeight: 0.5,
                              strokeOpacity: 0.5    
                        }
                  }]
            });

            bindButtons();
      }

      function createMarkers(locations) {
            _.forEach(locations, function(location) {
                  createMarker(location);
            });
      }

      function createMarker(location) { 

            var marker = getMarker(location);
            var infoBox = getInfoBox(location);

            // Stick our markers w/ associated infoboxes in a collection
            markers.push({
                  type: location.type, 
                  marker: marker, 
                  infoBox: infoBox 
            });

            google.maps.event.addListener(marker, 'mouseover', function() {
                  resolveInfoBox(this).open(map, this);
            });

            google.maps.event.addListener(marker, 'mouseout', function() {
                  resolveInfoBox(this).close(map);
            });
      }

      function bindButtons() {
            $amazeMap.find('li').on('click', function() {
                  var $this = $(this).toggleClass('highlighted');
                  highlightMarkers(
                        getMarkersByType(this.id), 
                        $this.hasClass('highlighted')
                  );
            });
      }

      function showButton(type) {
            $amazeMap.find('.' + type).addClass('show');
      }

      function highlightMarkers(markers, highlight) {
            
            var animation = highlight ? 
                  google.maps.Animation.BOUNCE :
                  null;

            _.forEach(markers, function(marker) {
                  marker.marker.setAnimation(animation);
            });
      }

      function getMarker(location) {
            return new google.maps.Marker({
                  position: location.position,
                  map: map,
                  title: location.name,
                  animation: google.maps.Animation.DROP,
                  icon: getMarkerPin(location)
            });
      }

      function getMarkerPin(location) {
            var color = colors[location.type];
            return new google.maps.MarkerImage(
                  'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + color,
                  null, /* size is determined at runtime */
                  null, /* origin is 0,0 */
                  null, /* anchor is bottom center of the scaled image */
                  null //new google.maps.Size(10, 17)
            );  
      }

      function getInfoBox(location) {
            return new InfoBox({
                  content: getInfoBoxContent(location),
                  disableAutoPan: false,
                  maxWidth: 150,
                  pixelOffset: new google.maps.Size(-75, 0),
                  zIndex: null,
                  boxStyle: {
                        background: 'none',
                        opacity: 1,
                        width: '150px'
                  },
                  closeBoxMargin: '12px 4px 2px 2px',
                  closeBoxURL: '',
                  infoBoxClearance: new google.maps.Size(1, 1)
            });
      }

      // Returns the infobox associated with the supplied marker
      function resolveInfoBox(marker) {
            return _.findWhere(markers, { marker: marker }).infoBox;
      }

      function getInfoBoxContent(location) {
            return '<div class="infobox ' +
                  location.type + '">' +
                  location.name +
                  '</div>'; 
      }

      function getPauseDuration(i) {
            // Use sine to give a nice easing on the staggered marker creation
            return Math.sin((i + 1) * (Math.PI / 2) / locationTypes.length) * introDuration;
      }

      function getLocationsByType(type) {
            return getByType(type, locations);
      }

      function getMarkersByType(type) {
            return getByType(type, markers);
      }

      function getByType(type, collection) {
            return _.where(collection, { type: type });
      }

      // Initialize when map is ready
      google.maps.event.addDomListener(window, 'load', initialize);

})(window, jQuery, _, google);


