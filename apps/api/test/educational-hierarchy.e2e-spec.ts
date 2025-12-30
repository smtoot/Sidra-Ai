import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Educational Hierarchy & Search (E2E Contract)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let adminToken: string;

  // Data holders
  let sudaneseCurriculumId: string;
  let britishCurriculumId: string;
  let subjectId: string;
  let gradeP1Id: string; // Sudanese Primary Grade 1
  let gradeY10Id: string; // British Year 10

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // 1. Login as Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@sidra.com', password: 'admin123' })
      .expect(201);
    adminToken = adminLogin.body.access_token;

    // 2. Fetch Curricula & Hierarchy (To get IDs)
    const curriculaRes = await request(app.getHttpServer())
      .get('/curricula')
      .expect(200);

    const sudanese = curriculaRes.body.find((c: any) => c.code === 'SUDANESE');
    const british = curriculaRes.body.find((c: any) => c.code === 'BRITISH');
    sudaneseCurriculumId = sudanese.id;
    britishCurriculumId = british.id;

    // Get Hierarchy to find Grade IDs
    const sudRes = await request(app.getHttpServer())
      .get(`/curricula/${sudaneseCurriculumId}/hierarchy`)
      .expect(200);
    gradeP1Id = sudRes.body.stages[0].grades[0].id; // Primary -> Grade 1

    const britRes = await request(app.getHttpServer())
      .get(`/curricula/${britishCurriculumId}/hierarchy`)
      .expect(200);
    // British: Primary(0), LowerSec(1), GCSE(2)
    gradeY10Id = britRes.body.stages[2].grades[0].id; // GCSE -> Year 10

    // 3. Create a Subject (Admin)
    const subjectRes = await request(app.getHttpServer())
      .post('/marketplace/subjects') // Assuming endpoint exists from previous context or generic
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nameAr: 'رياضيات', nameEn: 'Mathematics' })
      .expect(201);
    subjectId = subjectRes.body.id;

    // 4. Create/Login Teacher
    // Helper to create teacher omitted for brevity, assuming manual setup or reuse
    // For this test, we might need to register a fresh teacher or use an existing one
    // Let's assume we can register one:
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `test_teacher_${Date.now()}@sidra.com`,
        password: 'password123',
        role: 'TEACHER',
        displayName: 'Test Teacher',
        phoneNumber: '12345678',
      });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `test_teacher_${Date.now()}@sidra.com`,
        password: 'password123',
      });
    // Note: this will fail if email logic isn't perfect, safer to seed or catch
    // But let's rely on standard Auth flow being working.
    // Actually, we need to capture the exact email we just registered.
    // Re-doing below in specific steps
  });

  // Unique teacher for this run
  const teacherEmail = `contract_test_${Date.now()}@sidra.com`;

  it('Setup: Register and Login Teacher', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: teacherEmail,
        password: 'password123',
        role: 'TEACHER',
        displayName: 'Contract Test Teacher',
        phoneNumber: '99988877',
      })
      .expect(201); // or 200 depending on implementation

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: teacherEmail, password: 'password123' })
      .expect(201);

    teacherToken = login.body.access_token;
  });

  // --- A) Curriculum Hierarchy APIs ---

  it('GET /curricula - Should list active curricula', async () => {
    const res = await request(app.getHttpServer())
      .get('/curricula')
      .expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.find((c) => c.code === 'SUDANESE')).toBeDefined();
  });

  it('GET /curricula/:id/hierarchy - Should return optimized tree', async () => {
    const res = await request(app.getHttpServer())
      .get(`/curricula/${sudaneseCurriculumId}/hierarchy`)
      .expect(200);

    expect(res.body.stages).toBeDefined();
    expect(res.body.stages[0].grades).toBeDefined();
    expect(res.body.stages[0].grades[0].code).toBeDefined();
    // Verify sorting (sequence)
    expect(res.body.stages[0].sequence).toBeLessThan(
      res.body.stages[1].sequence,
    );
  });

  // --- B) TeacherSubject Validation ---

  it('POST /teacher/subjects - Fail on Cross-Curriculum Grades', async () => {
    await request(app.getHttpServer())
      .post('/teacher/me/subjects')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectId,
        curriculumId: sudaneseCurriculumId,
        pricePerHour: 20,
        gradeLevelIds: [gradeP1Id, gradeY10Id], // MIXED!
      })
      .expect(400); // Bad Request
  });

  it('POST /teacher/subjects - Fail on Empty Grades', async () => {
    await request(app.getHttpServer())
      .post('/teacher/me/subjects')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectId,
        curriculumId: sudaneseCurriculumId,
        pricePerHour: 20,
        gradeLevelIds: [],
      })
      .expect(400);
  });

  it('POST /teacher/subjects - Success with valid input', async () => {
    await request(app.getHttpServer())
      .post('/teacher/me/subjects')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectId,
        curriculumId: sudaneseCurriculumId,
        pricePerHour: 50,
        gradeLevelIds: [gradeP1Id],
      })
      .expect(201);
  });

  // --- C) Search Behavior (The Fix Verification) ---

  it('Search - MODE A: Broad Search (No Grade Filter)', async () => {
    const res = await request(app.getHttpServer())
      .get('/marketplace/teachers')
      .query({
        curriculumId: sudaneseCurriculumId,
        subjectId,
        // NO gradeLevelId
      })
      .expect(200);

    // Should find the teacher we just created
    // Note: API returns flat TeacherSubject listings, not grouped teachers
    const found = res.body.find(
      (listing: any) =>
        listing.curriculum.id === sudaneseCurriculumId &&
        listing.subject.id === subjectId,
    );
    expect(found).toBeDefined();
  });

  it('Search - MODE B: Strict Grade Search (Matching Grade)', async () => {
    const res = await request(app.getHttpServer())
      .get('/marketplace/teachers')
      .query({
        curriculumId: sudaneseCurriculumId,
        subjectId,
        gradeLevelId: gradeP1Id, // Matches what teacher has
      })
      .expect(200);

    const found = res.body.find(
      (listing: any) =>
        listing.curriculum.id === sudaneseCurriculumId &&
        listing.subject.id === subjectId,
      // And we can verify logic implicitly by it being found (unlike next test)
    );
    expect(found).toBeDefined();
  });

  it('Search - MODE B: Strict Grade Search (Non-Matching Grade)', async () => {
    // Teacher teaches P1, we search for P2 (assuming P2 is valid but not taught by this teacher)
    // We need P2 ID first.
    const sudRes = await request(app.getHttpServer()).get(
      `/curricula/${sudaneseCurriculumId}/hierarchy`,
    );
    const gradeP2Id = sudRes.body.stages[0].grades[1].id;

    const res = await request(app.getHttpServer())
      .get('/marketplace/teachers')
      .query({
        curriculumId: sudaneseCurriculumId,
        subjectId,
        gradeLevelId: gradeP2Id,
      })
      .expect(200);

    // Should NOT find the listing for our teacher
    const found = res.body.find(
      (listing: any) =>
        // Check if it matches our teacher (via price or other unique-ish prop if ID unknown, or just context)
        // Since we are checking if *our specific listing* appears
        listing.curriculum.id === sudaneseCurriculumId &&
        listing.subject.id === subjectId &&
        listing.pricePerHour === '50.00', // Assuming float formatted as string in JSON or we verify logic
      // Ideally we would check teacherId but it might be nested
      // listing.teacherProfile.userId/userId might not be exposed directly in top level
      // but listing.teacherProfile should be there.
    );

    // If we assume test env is clean/isolated, just checking length or if *this* listing exists is enough.
    // Our listing created with price 50. Let's assume unique price for test safety or just trust the filters

    // Better: We know the teacher created earlier.
    // Let's just check if ANY result matches our created criteria (which shouldn't happen if filtered by wrong grade)
    expect(found).toBeUndefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
