const mongoose = require('mongoose');
require('dotenv').config();
const models = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flashmob_learning';

const sampleVenues = [
  {
    venue_id: 'V001',
    name: 'Central Library',
    address: '123 University Ave',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    type: 'library',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.7
  },
  {
    venue_id: 'V002',
    name: 'Student Union Building',
    address: '456 Campus Dr',
    coordinates: { lat: 40.7138, lng: -74.0070 },
    type: 'student_center',
    wifi_quality: 4,
    noise_level: 3,
    study_rating: 4.3
  },
  {
    venue_id: 'V003',
    name: 'Engineering Library',
    address: '789 Tech Blvd',
    coordinates: { lat: 40.7148, lng: -74.0050 },
    type: 'library',
    wifi_quality: 5,
    noise_level: 1,
    study_rating: 4.9
  },
  {
    venue_id: 'V004',
    name: 'Coffee Shop Campus',
    address: '321 Main St',
    coordinates: { lat: 40.7118, lng: -74.0080 },
    type: 'cafe',
    wifi_quality: 4,
    noise_level: 4,
    study_rating: 4.0
  },
  {
    venue_id: 'V005',
    name: 'Science Building Lounge',
    address: '654 Research Way',
    coordinates: { lat: 40.7158, lng: -74.0040 },
    type: 'study_lounge',
    wifi_quality: 5,
    noise_level: 2,
    study_rating: 4.5
  }
];

const sampleLocations = [
  {
    location_id: 'L001',
    building: 'Science Building',
    room: 'LA-101',
    city: 'New York',
    capacity: 40,
    equipment: ['Projector', 'Whiteboard', 'Computer']
  },
  {
    location_id: 'L002',
    building: 'Engineering Hall',
    room: 'EH-205',
    city: 'New York',
    capacity: 35,
    equipment: ['Projector', 'Whiteboard']
  },
  {
    location_id: 'L003',
    building: 'Mathematics Building',
    room: 'MB-310',
    city: 'New York',
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
    console.log(`- ${sampleVenues.length} venues`);
    console.log(`- ${sampleLocations.length} locations`);
    console.log(`- ${sampleCourses.length} courses`);
    console.log(`- ${sampleInstructors.length} instructors`);
    console.log(`- ${sampleSections.length} sections`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

seedDatabase();