import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertGradeSchema, insertPaymentSchema, insertTeacherSchema, insertTeacherSalarySchema, insertUserSchema } from "@shared/schema";

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    const role = req.session?.userRole;
    if (!role || !roles.includes(role)) return res.status(403).json({ error: "غير مصرح" });
    next();
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Health check — must be first and fast
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      // Check users table first (admin, teacher, staff)
      const user = await storage.getUserByUsername(username);
      if (user && user.password === password) {
        (req.session as any).userId = user.id;
        (req.session as any).userRole = user.role;
        (req.session as any).userName = user.name;
        return res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, username: user.username } });
      }
      // Check students table (student login by username/password fields)
      const student = await storage.getStudentByUsername(username);
      if (student && student.password === password && !student.isDeleted) {
        (req.session as any).studentInternalId = student.internalId;
        (req.session as any).userRole = "student";
        (req.session as any).userName = student.studentName;
        return res.json({ success: true, user: { id: student.internalId, name: student.studentName, role: "student", username: student.username || username } });
      }
      return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    const studentInternalId = (req.session as any)?.studentInternalId;
    if (studentInternalId) {
      try {
        const student = await storage.getStudentByInternalId(studentInternalId);
        if (!student || student.isDeleted) return res.status(401).json({ error: "غير مسجل" });
        return res.json({ id: student.internalId, name: student.studentName, role: "student", username: student.username || "" });
      } catch (e) { return res.status(500).json({ error: String(e) }); }
    }
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "غير مسجل" });
    try {
      const users = await storage.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return res.status(401).json({ error: "غير مسجل" });
      res.json({ id: user.id, name: user.name, role: user.role, username: user.username });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Student portal — self-service endpoints
  app.get("/api/student/me", async (req, res) => {
    const internalId = (req.session as any)?.studentInternalId;
    if (!internalId || (req.session as any)?.userRole !== "student") return res.status(403).json({ error: "غير مصرح" });
    try {
      const student = await storage.getStudentByInternalId(internalId);
      if (!student) return res.status(404).json({ error: "الطالب غير موجود" });
      const grades = await storage.getGradeByStudentInternalId(internalId);
      const payments = await storage.getStudentPayments(internalId);
      res.json({ student, grades: grades || null, payments: payments || [] });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Dashboard
  app.get("/api/dashboard/stats", async (_req, res) => {
    try { res.json(await storage.getDashboardStats()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Students
  app.get("/api/students", async (req, res) => {
    try { res.json(await storage.getStudents(req.query.search as string)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/students/deleted", async (_req, res) => {
    try { res.json(await storage.getDeletedStudents()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/students/unassigned", async (_req, res) => {
    try { res.json(await storage.getUnassignedStudents()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/students/bulk-delete", async (req, res) => {
    try {
      const { internalIds } = req.body;
      if (!Array.isArray(internalIds)) return res.status(400).json({ error: "internalIds array required" });
      await storage.bulkDeleteStudents(internalIds);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/students/:id", async (req, res) => {
    try { res.json({ nextId: await storage.getNextStudentId() }); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/students/by-teacher/:teacherName", async (req, res) => {
    try { res.json(await storage.getStudentsByTeacher(decodeURIComponent(req.params.teacherName))); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/students/:internalId", async (req, res) => {
    try {
      const student = await storage.getStudentByInternalId(req.params.internalId);
      if (!student) return res.status(404).json({ error: "الطالب غير موجود" });
      res.json(student);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const data = insertStudentSchema.parse(req.body);
      res.json(await storage.createStudent(data));
    } catch (e: any) { res.status(400).json({ error: e.message || String(e) }); }
  });

  app.patch("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.updateStudent(req.params.id, req.body);
      if (!student) return res.status(404).json({ error: "الطالب غير موجود" });
      res.json(student);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/students/:internalId", async (req, res) => {
    try {
      await storage.softDeleteStudent(req.params.internalId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/students/:internalId/restore", async (req, res) => {
    try {
      await storage.restoreStudent(req.params.internalId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/students/:internalId/permanent", async (req, res) => {
    try {
      await storage.permanentDeleteStudent(req.params.internalId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Grades
  app.get("/api/grades", async (_req, res) => {
    try { res.json(await storage.getAllGrades()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/grades/:internalId", async (req, res) => {
    try {
      const grade = await storage.getGradeByStudentInternalId(req.params.internalId);
      res.json(grade || null);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.put("/api/grades/:internalId", async (req, res) => {
    try {
      const data = insertGradeSchema.parse({ ...req.body, internalId: req.params.internalId });
      res.json(await storage.upsertGrade(data));
    } catch (e: any) { res.status(400).json({ error: e.message || String(e) }); }
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    try { res.json(await storage.getPayments(req.query.search as string)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/payments/bulk-delete", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });
      await storage.bulkDeletePayments(ids);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/payments/deleted", async (_req, res) => {
    try { res.json(await storage.getDeletedPayments()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/payments/student/:internalId", async (req, res) => {
    try { res.json(await storage.getStudentPayments(req.params.internalId)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const data = insertPaymentSchema.parse(req.body);
      res.json(await storage.createPayment(data));
    } catch (e: any) { res.status(400).json({ error: e.message || String(e) }); }
  });

  app.patch("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.updatePayment(req.params.id, req.body);
      if (!payment) return res.status(404).json({ error: "الدفعة غير موجودة" });
      res.json(payment);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      await storage.softDeletePayment(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/payments/:id/restore", async (req, res) => {
    try {
      await storage.restorePayment(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/payments/:id/permanent", async (req, res) => {
    try {
      await storage.permanentDeletePayment(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teachers
  app.get("/api/teachers", async (_req, res) => {
    try { res.json(await storage.getTeachers()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/teachers/bulk-delete", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });
      await storage.bulkDeleteTeachers(ids);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/teachers/:id", async (req, res) => {
    try { res.json(await storage.getDeletedTeachers()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/teachers/:id", async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.params.id);
      if (!teacher) return res.status(404).json({ error: "المدرس غير موجود" });
      res.json(teacher);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      const data = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(data);
      await storage.syncTeacherUserAccount(teacher);
      res.json(teacher);
    } catch (e: any) { res.status(400).json({ error: e.message || String(e) }); }
  });

  app.patch("/api/teachers/:id", async (req, res) => {
    try {
      const teacher = await storage.updateTeacher(req.params.id, req.body);
      if (!teacher) return res.status(404).json({ error: "المدرس غير موجود" });
      await storage.syncTeacherUserAccount(teacher);
      res.json(teacher);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teacher portal - own info & students
  app.get("/api/teacher/me", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.status(404).json({ error: "لا يوجد حساب مدرس مرتبط" });
      const teacher = await storage.getTeacher(userRecord.teacherId);
      res.json(teacher || null);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/teacher/my-students", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.json([]);
      const teacher = await storage.getTeacher(userRecord.teacherId);
      if (!teacher) return res.json([]);
      const myStudents = await storage.getTeacherStudents(teacher.name);
      res.json(myStudents);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teacher portal — full students list for grade entry
  app.get("/api/teacher/my-students-full", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.json([]);
      const teacher = await storage.getTeacher(userRecord.teacherId);
      if (!teacher) return res.json([]);
      const myStudents = await storage.getTeacherStudentsFull(teacher.name);
      res.json(myStudents);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teacher portal — grades for a student
  app.get("/api/teacher/grades/:internalId", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.status(403).json({ error: "غير مصرح" });
      const teacher = await storage.getTeacher(userRecord.teacherId);
      if (!teacher) return res.status(403).json({ error: "غير مصرح" });
      // Verify student belongs to this teacher
      const student = await storage.getStudentByInternalId(req.params.internalId);
      if (!student || student.teacherName !== teacher.name) return res.status(403).json({ error: "غير مصرح - هذا الطالب ليس في مجموعتك" });
      const grade = await storage.getGradeByStudentInternalId(req.params.internalId);
      res.json(grade || null);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teacher portal — save grades for a student
  app.post("/api/teacher/grades/:internalId", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.status(403).json({ error: "غير مصرح" });
      const teacher = await storage.getTeacher(userRecord.teacherId);
      if (!teacher) return res.status(403).json({ error: "غير مصرح" });
      const student = await storage.getStudentByInternalId(req.params.internalId);
      if (!student || student.teacherName !== teacher.name) return res.status(403).json({ error: "غير مصرح - هذا الطالب ليس في مجموعتك" });
      const gradeData = { ...req.body, internalId: req.params.internalId, studentId: student.studentId, studentName: student.studentName };
      const saved = await storage.upsertGrade(gradeData);
      res.json(saved);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teacher portal — update own profile
  app.patch("/api/teacher/profile", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.status(404).json({ error: "لا يوجد ملف مدرس" });
      // Only allow profile fields (not username/password here)
      const { bio, avatar, backgroundImage, phone, email, subject, name } = req.body;
      const updated = await storage.updateTeacherProfile(userRecord.teacherId, { bio, avatar, backgroundImage, phone, email, subject, name: name || undefined });
      res.json(updated);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teacher portal — change credentials (username / password)
  app.patch("/api/teacher/credentials", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.status(404).json({ error: "لا يوجد ملف مدرس" });
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
      // Update teacher record
      const updatedTeacher = await storage.updateTeacherProfile(userRecord.teacherId, { username, password });
      // Sync the user account
      if (updatedTeacher) await storage.syncTeacherUserAccount(updatedTeacher);
      // Notify admin via teacher message
      const adminMsg = `⚠️ تنبيه: قام المدرس "${userRecord.name}" بتغيير بيانات دخوله — اسم المستخدم الجديد: ${username}`;
      await storage.createTeacherMessage({ id: `cred-${Date.now()}`, teacherId: userRecord.teacherId, teacherName: userRecord.name, message: adminMsg });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teacher portal — messages
  app.get("/api/teacher/messages", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.json([]);
      const msgs = await storage.getTeacherMessages(userRecord.teacherId);
      res.json(msgs);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/teacher/messages", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      if (!userId || userRole !== "teacher") return res.status(403).json({ error: "غير مصرح" });
      const allUsers = await storage.getUsers();
      const userRecord = allUsers.find(u => u.id === userId);
      if (!userRecord?.teacherId) return res.status(404).json({ error: "لا يوجد ملف مدرس" });
      const { message } = req.body;
      if (!message?.trim()) return res.status(400).json({ error: "الرسالة مطلوبة" });
      const msg = await storage.createTeacherMessage({ id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`, teacherId: userRecord.teacherId, teacherName: userRecord.name, message: message.trim() });
      res.json(msg);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Admin — view all teacher messages
  app.get("/api/admin/teacher-messages", requireRole(["admin", "moderator"]), async (_req, res) => {
    try { res.json(await storage.getAllTeacherMessages()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/admin/teacher-messages/bulk-delete", requireRole(["admin"]), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });
      await storage.bulkDeleteMessages(ids);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Admin — reply to teacher message
  app.post("/api/admin/teacher-messages/:id/reply", requireRole(["admin", "moderator"]), async (req, res) => {
    try {
      const { reply } = req.body;
      if (!reply?.trim()) return res.status(400).json({ error: "الرد مطلوب" });
      const updated = await storage.replyToTeacherMessage(req.params.id, reply.trim());
      res.json(updated);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      await storage.softDeleteTeacher(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/teachers/:id/restore", async (req, res) => {
    try {
      await storage.restoreTeacher(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/teachers/:id/permanent", async (req, res) => {
    try {
      await storage.permanentDeleteTeacher(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Teacher Salaries
  app.get("/api/salaries", async (req, res) => {
    try { res.json(await storage.getTeacherSalaries(req.query.teacherId as string)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/salaries", async (req, res) => {
    try {
      const data = insertTeacherSalarySchema.parse(req.body);
      res.json(await storage.createTeacherSalary(data));
    } catch (e: any) { res.status(400).json({ error: e.message || String(e) }); }
  });

  app.patch("/api/salaries/:id", async (req, res) => {
    try {
      const salary = await storage.updateTeacherSalary(req.params.id, req.body);
      if (!salary) return res.status(404).json({ error: "الراتب غير موجود" });
      res.json(salary);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/salaries/:id", async (req, res) => {
    try {
      await storage.deleteTeacherSalary(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // Users / Accounts
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      res.json(await storage.createUser(data));
    } catch (e: any) { res.status(400).json({ error: e.message || String(e) }); }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
      res.json({ ...user, password: undefined });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/trash/empty", async (_req, res) => {
    try { await storage.emptyTrash(); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/payments/stats/by-receiver", async (_req, res) => {
    try { res.json(await storage.getPaymentStatsByReceiver()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/payments/stats/student-counts", async (_req, res) => {
    try { res.json(await storage.getStudentPaymentCounts()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/admin/import-students", async (req, res) => {
    try {
      const { students: studentsData } = req.body;
      if (!Array.isArray(studentsData)) return res.status(400).json({ error: "students array required" });
      await storage.importStudents(studentsData);
      res.json({ success: true, count: studentsData.length });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/admin/wipe-data", requireRole(["admin"]), async (_req, res) => {
    try {
      await storage.wipeAllData();
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/settings", async (_req, res) => {
    try { res.json(await storage.getSettings()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/settings", requireRole(["admin", "moderator"]), async (req, res) => {
    try {
      const data = req.body;
      if (typeof data !== "object" || Array.isArray(data)) return res.status(400).json({ error: "object required" });
      await storage.setSettings(data);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  return httpServer;
}
