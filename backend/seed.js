const mongoose = require('mongoose');
require('dotenv').config();
const models = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flashmob_learning';

const sampleVenues = [
  // Warrensburg, Missouri Venues
  {
    venue_id: 'V001',
    name: 'UCM James C. Kirkpatrick Library',
    address: '100 E South St, Warrensburg, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-93.7344, 38.7625] // [lng, lat]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 1,
    study_rating: 4.9
  },
  {
    venue_id: 'V002',
    name: 'Trails Regional Library',
    address: '432 N Holden St, Warrensburg, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-93.7397, 38.7644]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },
  {
    venue_id: 'V003',
    name: 'Main Street Coffee House',
    address: '117 N Holden St, Warrensburg, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-93.7390, 38.7623]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 3,
    study_rating: 4.3
  },
  {
    venue_id: 'V004',
    name: 'UCM Student Union Study Lounge',
    address: '300 S Holden St, Warrensburg, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-93.7380, 38.7595]
    },
    type: 'study_lounge',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.5
  },
  {
    venue_id: 'V005',
    name: 'Ground Zero Coffee',
    address: '105 E Pine St, Warrensburg, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-93.7365, 38.7618]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 3,
    study_rating: 4.2
  },

  // Kansas City, KS/MO Venues
  {
    venue_id: 'V006',
    name: 'Kansas City Public Library - Central',
    address: '14 W 10th St, Kansas City, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-94.5827, 39.1006]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.8
  },
  {
    venue_id: 'V007',
    name: 'UMKC Miller Nichols Library',
    address: '800 E 51st St, Kansas City, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-94.5767, 39.0352]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },
  {
    venue_id: 'V008',
    name: 'Broadway Cafe & Roastery',
    address: '4012 Broadway, Kansas City, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-94.5897, 39.0587]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 3,
    study_rating: 4.2
  },
  {
    venue_id: 'V009',
    name: 'Johnson County Library - Central',
    address: '9875 W 87th St, Overland Park, KS',
    coordinates: {
      type: 'Point',
      coordinates: [-94.6708, 38.9622]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 1,
    study_rating: 4.9
  },
  {
    venue_id: 'V010',
    name: 'The Roasterie Cafe',
    address: '1204 W 27th St, Kansas City, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-94.5952, 39.0778]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 3,
    study_rating: 4.1
  },
  {
    venue_id: 'V011',
    name: 'Kansas City Public Library - Plaza',
    address: '4801 Main St, Kansas City, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-94.5886, 39.0416]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.6
  },
  {
    venue_id: 'V012',
    name: 'Quay Coffee',
    address: '413 Delaware St, Kansas City, MO',
    coordinates: {
      type: 'Point',
      coordinates: [-94.5844, 39.1063]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 3,
    study_rating: 4.3
  },
  {
    venue_id: 'V013',
    name: 'Johnson County Library - Olathe',
    address: '201 N Chestnut St, Olathe, KS',
    coordinates: {
      type: 'Point',
      coordinates: [-94.8191, 38.8831]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },

  // New York City Venues
  {
    venue_id: 'V014',
    name: 'New York Public Library - Main',
    address: '476 5th Ave, New York, NY',
    coordinates: {
      type: 'Point',
      coordinates: [-73.9822, 40.7532]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.9
  },
  {
    venue_id: 'V015',
    name: 'Columbia University Butler Library',
    address: '535 W 114th St, New York, NY',
    coordinates: {
      type: 'Point',
      coordinates: [-73.9635, 40.8066]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 1,
    study_rating: 4.8
  },
  {
    venue_id: 'V016',
    name: 'Think Coffee Union Square',
    address: '123 4th Ave, New York, NY',
    coordinates: {
      type: 'Point',
      coordinates: [-73.9898, 40.7338]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 4,
    study_rating: 4.0
  },

  // Los Angeles Venues
  {
    venue_id: 'V017',
    name: 'Los Angeles Central Library',
    address: '630 W 5th St, Los Angeles, CA',
    coordinates: {
      type: 'Point',
      coordinates: [-118.2571, 34.0522]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },
  {
    venue_id: 'V018',
    name: 'UCLA Powell Library',
    address: '100 Powell Library, Los Angeles, CA',
    coordinates: {
      type: 'Point',
      coordinates: [-118.4422, 34.0722]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.8
  },
  {
    venue_id: 'V019',
    name: 'Blue Bottle Coffee - Arts District',
    address: '582 Mateo St, Los Angeles, CA',
    coordinates: {
      type: 'Point',
      coordinates: [-118.2314, 34.0392]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 3,
    study_rating: 4.2
  },

  // Chicago Venues
  {
    venue_id: 'V020',
    name: 'Harold Washington Library Center',
    address: '400 S State St, Chicago, IL',
    coordinates: {
      type: 'Point',
      coordinates: [-87.6286, 41.8761]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.8
  },
  {
    venue_id: 'V021',
    name: 'University of Chicago Regenstein Library',
    address: '1100 E 57th St, Chicago, IL',
    coordinates: {
      type: 'Point',
      coordinates: [-87.5987, 41.7906]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 1,
    study_rating: 4.9
  },
  {
    venue_id: 'V022',
    name: 'Intelligentsia Coffee - Millennium Park',
    address: '53 E Randolph St, Chicago, IL',
    coordinates: {
      type: 'Point',
      coordinates: [-87.6244, 41.8844]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 3,
    study_rating: 4.1
  },

  // Houston Venues
  {
    venue_id: 'V023',
    name: 'Houston Public Library - Central',
    address: '500 McKinney St, Houston, TX',
    coordinates: {
      type: 'Point',
      coordinates: [-95.3698, 29.7620]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },
  {
    venue_id: 'V024',
    name: 'Rice University Fondren Library',
    address: '6100 Main St, Houston, TX',
    coordinates: {
      type: 'Point',
      coordinates: [-95.3988, 29.7174]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 1,
    study_rating: 4.8
  },

  // Phoenix Venues
  {
    venue_id: 'V025',
    name: 'Burton Barr Central Library',
    address: '1221 N Central Ave, Phoenix, AZ',
    coordinates: {
      type: 'Point',
      coordinates: [-112.0731, 33.4635]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.6
  },
  {
    venue_id: 'V026',
    name: 'ASU Hayden Library',
    address: '1000 S Cady Mall, Tempe, AZ',
    coordinates: {
      type: 'Point',
      coordinates: [-111.9344, 33.4175]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },

  // Seattle Venues
  {
    venue_id: 'V027',
    name: 'Seattle Central Library',
    address: '1000 4th Ave, Seattle, WA',
    coordinates: {
      type: 'Point',
      coordinates: [-122.3328, 47.6062]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.9
  },
  {
    venue_id: 'V028',
    name: 'UW Suzzallo Library',
    address: '4000 15th Ave NE, Seattle, WA',
    coordinates: {
      type: 'Point',
      coordinates: [-122.3089, 47.6566]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 1,
    study_rating: 4.8
  },

  // Boston Venues
  {
    venue_id: 'V029',
    name: 'Boston Public Library - Copley',
    address: '700 Boylston St, Boston, MA',
    coordinates: {
      type: 'Point',
      coordinates: [-71.0778, 42.3493]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.8
  },
  {
    venue_id: 'V030',
    name: 'MIT Libraries - Hayden',
    address: '160 Memorial Dr, Cambridge, MA',
    coordinates: {
      type: 'Point',
      coordinates: [-71.0942, 42.3601]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 1,
    study_rating: 4.9
  },

  // San Francisco Venues
  {
    venue_id: 'V031',
    name: 'San Francisco Main Library',
    address: '100 Larkin St, San Francisco, CA',
    coordinates: {
      type: 'Point',
      coordinates: [-122.4156, 37.7794]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },
  {
    venue_id: 'V032',
    name: 'Blue Bottle Coffee - Ferry Building',
    address: '1 Ferry Building, San Francisco, CA',
    coordinates: {
      type: 'Point',
      coordinates: [-122.3934, 37.7956]
    },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 4,
    study_rating: 4.0
  },

  // Denver Venues
  {
    venue_id: 'V033',
    name: 'Denver Public Library - Central',
    address: '10 W 14th Ave Pkwy, Denver, CO',
    coordinates: {
      type: 'Point',
      coordinates: [-104.9885, 39.7373]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },
  {
    venue_id: 'V034',
    name: 'CU Denver Auraria Library',
    address: '1100 Lawrence St, Denver, CO',
    coordinates: {
      type: 'Point',
      coordinates: [-105.0013, 39.7447]
    },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.6
  }
];

const sampleLocations = [
  {
    location_id: 'L001',
    building: 'Science Building',
    room: 'LA-101',
    city: 'Warrensburg',
    capacity: 40,
    equipment: ['Projector', 'Whiteboard', 'Computer']
  },
  {
    location_id: 'L002',
    building: 'Engineering Hall',
    room: 'EH-205',
    city: 'Warrensburg',
    capacity: 35,
    equipment: ['Projector', 'Whiteboard']
  },
  {
    location_id: 'L003',
    building: 'Mathematics Building',
    room: 'MB-310',
    city: 'Warrensburg',
    capacity: 30,
    equipment: ['Whiteboard', 'Smart Board']
  }
];

const sampleCourses = [
  {
    course_id: 'MATH201',
    course_name: 'Calculus II',
    description: 'Advanced integration techniques and series',
    subject: 'Mathematics',
    credits: 4
  },
  {
    course_id: 'CS101',
    course_name: 'Introduction to Computer Science',
    description: 'Fundamentals of programming and CS',
    subject: 'Computer Science',
    credits: 3
  },
  {
    course_id: 'PHYS201',
    course_name: 'Physics II',
    description: 'Electricity and magnetism',
    subject: 'Physics',
    credits: 4
  }
];

const sampleInstructors = [
  {
    instructor_id: 'I001',
    user_id: 201,
    name: 'Dr. Sarah Smith',
    email: 'smith@university.edu',
    specialization: ['Mathematics', 'Statistics'],
    bio: 'PhD in Applied Mathematics, 10 years teaching experience'
  },
  {
    instructor_id: 'I002',
    user_id: 202,
    name: 'Prof. John Davis',
    email: 'davis@university.edu',
    specialization: ['Computer Science', 'Algorithms'],
    bio: 'PhD in Computer Science, research in AI and ML'
  },
  {
    instructor_id: 'I003',
    user_id: 203,
    name: 'Dr. Emily Johnson',
    email: 'johnson@university.edu',
    specialization: ['Physics', 'Engineering'],
    bio: 'PhD in Physics, specializing in electromagnetism'
  }
];

const sampleSections = [
  {
    section_id: 'SEC001',
    course_id: 'MATH201',
    instructor_id: 'I001',
    location_id: 'L003',
    capacity: 30,
    meeting_days: ['Monday', 'Wednesday', 'Friday'],
    meeting_time: '09:00-10:00',
    semester: 'Fall 2025'
  },
  {
    section_id: 'SEC002',
    course_id: 'CS101',
    instructor_id: 'I002',
    location_id: 'L001',
    capacity: 40,
    meeting_days: ['Tuesday', 'Thursday'],
    meeting_time: '14:00-15:30',
    semester: 'Fall 2025'
  },
  {
    section_id: 'SEC003',
    course_id: 'PHYS201',
    instructor_id: 'I003',
    location_id: 'L002',
    capacity: 35,
    meeting_days: ['Monday', 'Wednesday'],
    meeting_time: '11:00-12:30',
    semester: 'Fall 2025'
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    console.log('Clearing existing data...');
    await Promise.all([
      models.Venue.deleteMany({}),
      models.Location.deleteMany({}),
      models.Course.deleteMany({}),
      models.Instructor.deleteMany({}),
      models.Section.deleteMany({})
    ]);
    console.log('Existing data cleared.');

    console.log('Inserting venues...');
    await models.Venue.insertMany(sampleVenues);
    console.log(`${sampleVenues.length} venues inserted.`);

    console.log('Inserting locations...');
    await models.Location.insertMany(sampleLocations);
    console.log(`${sampleLocations.length} locations inserted.`);

    console.log('Inserting courses...');
    await models.Course.insertMany(sampleCourses);
    console.log(`${sampleCourses.length} courses inserted.`);

    console.log('Inserting instructors...');
    await models.Instructor.insertMany(sampleInstructors);
    console.log(`${sampleInstructors.length} instructors inserted.`);

    console.log('Inserting sections...');
    await models.Section.insertMany(sampleSections);
    console.log(`${sampleSections.length} sections inserted.`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample data summary:');
    console.log(`- ${sampleVenues.length} venues across multiple cities`);
    console.log(`- ${sampleLocations.length} locations`);
    console.log(`- ${sampleCourses.length} courses`);
    console.log(`- ${sampleInstructors.length} instructors`);
    console.log(`- ${sampleSections.length} sections`);
    console.log('\nCities covered:');
    console.log('- Warrensburg, MO (5 venues) ⭐ PRIMARY');
    console.log('- Kansas City area (8 venues) ⭐ PRIMARY');
    console.log('- New York (3 venues)');
    console.log('- Los Angeles (3 venues)');
    console.log('- Chicago (3 venues)');
    console.log('- Houston (2 venues)');
    console.log('- Phoenix (2 venues)');
    console.log('- Seattle (2 venues)');
    console.log('- Boston (2 venues)');
    console.log('- San Francisco (2 venues)');
    console.log('- Denver (2 venues)');
    console.log('\n📍 Distance from Warrensburg to Kansas City: ~50 miles');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

seedDatabase();