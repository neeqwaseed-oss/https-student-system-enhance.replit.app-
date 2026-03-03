import { db } from "./db";
import { users, teachers, teacherSalaries, students, grades, payments, systemSettings, teacherMessages } from "@shared/schema";
import type { InsertUser, User, InsertTeacher, Teacher, InsertTeacherSalary, TeacherSalary, InsertStudent, Student, InsertGrade, Grade, InsertPayment, Payment, TeacherMessage } from "@shared/schema";
import { eq, and, ilike, or, desc, sql, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Auth
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // Teachers
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, data: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  softDeleteTeacher(id: string): Promise<void>;
  bulkDeleteTeachers(ids: string[]): Promise<void>;
  getDeletedTeachers(): Promise<Teacher[]>;
  restoreTeacher(id: string): Promise<void>;
  permanentDeleteTeacher(id: string): Promise<void>;
  syncTeacherUserAccount(teacher: Teacher): Promise<void>;
  getTeacherStudents(teacherName: string): Promise<{ studentName: string; username: string | null; password: string | null; institution: string | null }[]>;

  // Teacher Salaries
  getTeacherSalaries(teacherId?: string): Promise<TeacherSalary[]>;
  createTeacherSalary(salary: InsertTeacherSalary): Promise<TeacherSalary>;
  updateTeacherSalary(id: string, data: Partial<InsertTeacherSalary>): Promise<TeacherSalary | undefined>;
  deleteTeacherSalary(id: string): Promise<void>;

  // Students
  getStudents(search?: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByInternalId(internalId: string): Promise<Student | undefined>;
  getStudentByUsername(username: string): Promise<Student | undefined>;
  getStudentsByTeacher(teacherName: string): Promise<Student[]>;
  getUnassignedStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined>;
  softDeleteStudent(internalId: string): Promise<void>;
  bulkDeleteStudents(internalIds: string[]): Promise<void>;
  getDeletedStudents(): Promise<Student[]>;
  restoreStudent(internalId: string): Promise<void>;
  permanentDeleteStudent(internalId: string): Promise<void>;
  emptyTrash(): Promise<void>;

  // Grades
  getAllGrades(): Promise<Grade[]>;
  getGradeByStudentInternalId(internalId: string): Promise<Grade | undefined>;
  upsertGrade(grade: InsertGrade): Promise<Grade>;

  // Payments
  getPayments(search?: string): Promise<Payment[]>;
  getStudentPayments(internalId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  softDeletePayment(id: string): Promise<void>;
  bulkDeletePayments(ids: string[]): Promise<void>;
  getDeletedPayments(): Promise<Payment[]>;
  restorePayment(id: string): Promise<void>;
  permanentDeletePayment(id: string): Promise<void>;

  // Stats
  getDashboardStats(): Promise<{
    totalStudents: number;
    activeStudents: number;
    totalPayments: number;
    totalRevenue: number;
    totalTeachers: number;
  }>;
  getNextStudentId(): Promise<string>;
  getPaymentStatsByReceiver(): Promise<{ receiverName: string; accountType: string; count: number; total: number }[]>;
  getStudentPaymentCounts(): Promise<{ 
    internalId: string; 
    studentName: string; 
    studentId: string; 
    institution: string; 
    teacherName: string;
    paymentCount: number; 
    totalPaid: number;
    subscriptionPrice: number;
    discountValue: number;
    remainingAmount: number;
    isFullyPaid: boolean;
  }[]>;

  // Settings
  getSettings(): Promise<Record<string, string>>;
  getSetting(key: string): Promise<string | null>;
  setSettings(data: Record<string, string>): Promise<void>;

  // Teacher Messages
  getTeacherMessages(teacherId: string): Promise<TeacherMessage[]>;
  getAllTeacherMessages(): Promise<TeacherMessage[]>;
  createTeacherMessage(data: { id: string; teacherId: string; teacherName: string; message: string }): Promise<TeacherMessage>;
  replyToTeacherMessage(id: string, reply: string): Promise<TeacherMessage | undefined>;
  markMessageRead(id: string): Promise<void>;
  bulkDeleteMessages(ids: string[]): Promise<void>;

  // Teacher Portal Extras
  getTeacherStudentsFull(teacherName: string): Promise<Student[]>;
  updateTeacherProfile(id: string, data: Partial<InsertTeacher>): Promise<Teacher | undefined>;

  // Seed & Maintenance
  seedData(): Promise<void>;
  importStudents(students: any[]): Promise<void>;
  wipeAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Add a helper to check if DB is connected
  private async checkConnection() {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (e) {
      return false;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values({ ...user, id: randomUUID() }).returning();
    return created;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getTeachers(): Promise<Teacher[]> {
    return db.select().from(teachers).where(eq(teachers.isDeleted, false)).orderBy(teachers.name);
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [created] = await db.insert(teachers).values({ ...teacher, id: randomUUID() }).returning();
    return created;
  }

  async updateTeacher(id: string, data: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [updated] = await db.update(teachers).set(data).where(eq(teachers.id, id)).returning();
    return updated;
  }

  async softDeleteTeacher(id: string): Promise<void> {
    await db.update(teachers).set({ isDeleted: true, deletedAt: new Date() }).where(eq(teachers.id, id));
  }

  async bulkDeleteTeachers(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.update(teachers).set({ isDeleted: true, deletedAt: new Date() }).where(inArray(teachers.id, ids));
  }

  async getDeletedTeachers(): Promise<Teacher[]> {
    return db.select().from(teachers).where(eq(teachers.isDeleted, true));
  }

  async restoreTeacher(id: string): Promise<void> {
    await db.update(teachers).set({ isDeleted: false, deletedAt: null }).where(eq(teachers.id, id));
  }

  async permanentDeleteTeacher(id: string): Promise<void> {
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  async syncTeacherUserAccount(teacher: Teacher): Promise<void> {
    if (!teacher.username || !teacher.password) return;
    const [byTeacherId] = await db.select().from(users).where(eq(users.teacherId, teacher.id));
    if (byTeacherId) {
      await db.update(users).set({
        username: teacher.username,
        password: teacher.password,
        name: teacher.name,
        isActive: teacher.isActive,
      }).where(eq(users.id, byTeacherId.id));
      return;
    }
    const [byUsername] = await db.select().from(users).where(eq(users.username, teacher.username));
    if (byUsername) {
      await db.update(users).set({
        teacherId: teacher.id,
        name: teacher.name,
        password: teacher.password,
        isActive: teacher.isActive,
        role: "teacher",
      }).where(eq(users.id, byUsername.id));
      return;
    }
    await db.insert(users).values({
      id: randomUUID(),
      username: teacher.username,
      password: teacher.password,
      name: teacher.name,
      role: "teacher",
      teacherId: teacher.id,
      isActive: teacher.isActive,
    });
  }

  async getTeacherStudents(teacherName: string): Promise<{ studentName: string; username: string | null; password: string | null; institution: string | null }[]> {
    return db.select({
      studentName: students.studentName,
      username: students.username,
      password: students.password,
      institution: students.institution,
    }).from(students).where(
      and(eq(students.teacherName, teacherName), eq(students.isDeleted, false), eq(students.isActive, true))
    ).orderBy(students.studentName);
  }

  async getTeacherSalaries(teacherId?: string): Promise<TeacherSalary[]> {
    if (teacherId) {
      return db.select().from(teacherSalaries).where(eq(teacherSalaries.teacherId, teacherId)).orderBy(desc(teacherSalaries.year), desc(teacherSalaries.month));
    }
    return db.select().from(teacherSalaries).orderBy(desc(teacherSalaries.year), desc(teacherSalaries.month));
  }

  async createTeacherSalary(salary: InsertTeacherSalary): Promise<TeacherSalary> {
    const [created] = await db.insert(teacherSalaries).values({ ...salary, id: randomUUID() }).returning();
    return created;
  }

  async updateTeacherSalary(id: string, data: Partial<InsertTeacherSalary>): Promise<TeacherSalary | undefined> {
    const [updated] = await db.update(teacherSalaries).set(data).where(eq(teacherSalaries.id, id)).returning();
    return updated;
  }

  async deleteTeacherSalary(id: string): Promise<void> {
    await db.delete(teacherSalaries).where(eq(teacherSalaries.id, id));
  }

  async getStudents(search?: string): Promise<Student[]> {
    if (search) {
      return db.select().from(students).where(
        and(
          eq(students.isDeleted, false),
          or(
            ilike(students.studentName, `%${search}%`),
            ilike(students.studentId, `%${search}%`),
            ilike(students.institution, `%${search}%`),
            ilike(students.teacherName, `%${search}%`),
          )
        )
      ).orderBy(desc(students.createdAt));
    }
    return db.select().from(students).where(eq(students.isDeleted, false)).orderBy(desc(students.createdAt));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByInternalId(internalId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.internalId, internalId));
    return student;
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.username, username));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values({ ...student, id: randomUUID() }).returning();
    return created;
  }

  async updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db.update(students).set({ ...data, lastUpdated: new Date().toISOString() }).where(eq(students.id, id)).returning();
    return updated;
  }

  async softDeleteStudent(internalId: string): Promise<void> {
    await db.update(students).set({ isDeleted: true, deletedAt: new Date(), isActive: false }).where(eq(students.internalId, internalId));
  }

  async bulkDeleteStudents(internalIds: string[]): Promise<void> {
    if (internalIds.length === 0) return;
    await db.update(students).set({ isDeleted: true, deletedAt: new Date(), isActive: false }).where(inArray(students.internalId, internalIds));
  }

  async getDeletedStudents(): Promise<Student[]> {
    return db.select().from(students).where(eq(students.isDeleted, true)).orderBy(desc(students.deletedAt));
  }

  async restoreStudent(internalId: string): Promise<void> {
    await db.update(students).set({ isDeleted: false, deletedAt: null, isActive: true }).where(eq(students.internalId, internalId));
  }

  async getStudentsByTeacher(teacherName: string): Promise<Student[]> {
    return db.select().from(students).where(
      and(eq(students.isDeleted, false), eq(students.teacherName, teacherName))
    ).orderBy(students.studentName);
  }

  async getUnassignedStudents(): Promise<Student[]> {
    return db.select().from(students).where(
      and(eq(students.isDeleted, false), sql`(${students.teacherName} IS NULL OR ${students.teacherName} = '')`)
    ).orderBy(students.studentName);
  }

  async emptyTrash(): Promise<void> {
    await db.delete(students).where(eq(students.isDeleted, true));
    await db.delete(teachers).where(eq(teachers.isDeleted, true));
    await db.delete(payments).where(eq(payments.isDeleted, true));
  }

  async permanentDeleteStudent(internalId: string): Promise<void> {
    await db.delete(students).where(eq(students.internalId, internalId));
  }

  async getAllGrades(): Promise<Grade[]> {
    return db.select().from(grades);
  }

  async getGradeByStudentInternalId(internalId: string): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.internalId, internalId));
    return grade;
  }

  async upsertGrade(grade: InsertGrade): Promise<Grade> {
    const existing = await this.getGradeByStudentInternalId(grade.internalId);
    if (existing) {
      const [updated] = await db.update(grades).set({ ...grade, updatedAt: new Date() }).where(eq(grades.internalId, grade.internalId)).returning();
      return updated;
    }
    const [created] = await db.insert(grades).values({ ...grade, id: randomUUID() }).returning();
    return created;
  }

  async getPayments(search?: string): Promise<Payment[]> {
    if (search) {
      return db.select().from(payments).where(
        and(
          eq(payments.isDeleted, false),
          or(
            ilike(payments.studentName, `%${search}%`),
            ilike(payments.studentId, `%${search}%`),
          )
        )
      ).orderBy(desc(payments.createdAt));
    }
    return db.select().from(payments).where(eq(payments.isDeleted, false)).orderBy(desc(payments.createdAt));
  }

  async getStudentPayments(internalId: string): Promise<Payment[]> {
    return db.select().from(payments).where(and(eq(payments.internalId, internalId), eq(payments.isDeleted, false))).orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values({ ...payment, id: randomUUID() }).returning();
    return created;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return updated;
  }

  async softDeletePayment(id: string): Promise<void> {
    await db.update(payments).set({ isDeleted: true, deletedAt: new Date() }).where(eq(payments.id, id));
  }

  async bulkDeletePayments(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.update(payments).set({ isDeleted: true, deletedAt: new Date() }).where(inArray(payments.id, ids));
  }

  async getDeletedPayments(): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.isDeleted, true)).orderBy(desc(payments.deletedAt));
  }

  async restorePayment(id: string): Promise<void> {
    await db.update(payments).set({ isDeleted: false, deletedAt: null }).where(eq(payments.id, id));
  }

  async permanentDeletePayment(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  async getNextStudentId(): Promise<string> {
    const [result] = await db.select({ maxId: sql<string>`max(student_id)` }).from(students).where(eq(students.isDeleted, false));
    const maxId = result?.maxId;
    if (!maxId || !/^\d+$/.test(maxId)) {
      const year = new Date().getFullYear();
      return `${year}0001`;
    }
    const num = parseInt(maxId) + 1;
    return String(num);
  }

  async getPaymentStatsByReceiver(): Promise<{ receiverName: string; accountType: string; count: number; total: number }[]> {
    const result = await db
      .select({
        receiverName: payments.receiverName,
        accountType: payments.accountType,
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(eq(payments.isDeleted, false))
      .groupBy(payments.receiverName, payments.accountType)
      .orderBy(desc(sql`sum(${payments.amount})`));
    return result.map(r => ({
      receiverName: r.receiverName || "غير محدد",
      accountType: r.accountType || "",
      count: Number(r.count),
      total: Number(r.total),
    }));
  }

  async getStudentPaymentCounts(): Promise<{ internalId: string; studentName: string; studentId: string; institution: string; teacherName: string; paymentCount: number; totalPaid: number; subscriptionPrice: number; discountValue: number; remainingAmount: number; isFullyPaid: boolean }[]> {
    const allStudents = await db.select().from(students).where(and(eq(students.isDeleted, false), eq(students.isActive, true)));
    const allPayments = await db.select({
      internalId: payments.internalId,
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    }).from(payments).where(eq(payments.isDeleted, false)).groupBy(payments.internalId);

    const payMap = new Map(allPayments.map(p => [p.internalId, { count: Number(p.count), total: Number(p.total) }]));
    return allStudents.map(s => {
      const paid = payMap.get(s.internalId);
      const totalPaid = paid?.total || 0;
      const totalDue = (Number(s.subscriptionPrice) || 0) - (Number(s.discountValue) || 0);
      const remaining = Math.max(0, totalDue - totalPaid);
      return {
        internalId: s.internalId,
        studentName: s.studentName,
        studentId: s.studentId,
        institution: s.institution || "",
        teacherName: s.teacherName || "",
        paymentCount: paid?.count || 0,
        totalPaid,
        subscriptionPrice: Number(s.subscriptionPrice) || 0,
        discountValue: Number(s.discountValue) || 0,
        remainingAmount: remaining,
        isFullyPaid: totalDue > 0 && totalPaid >= totalDue,
      };
    });
  }

  async getDashboardStats() {
    const [totalStudents] = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.isDeleted, false));
    const [activeStudents] = await db.select({ count: sql<number>`count(*)` }).from(students).where(and(eq(students.isDeleted, false), eq(students.isActive, true)));
    const [paymentStats] = await db.select({ count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(amount), 0)` }).from(payments).where(eq(payments.isDeleted, false));
    const [totalTeachers] = await db.select({ count: sql<number>`count(*)` }).from(teachers).where(eq(teachers.isDeleted, false));

    return {
      totalStudents: Number(totalStudents.count),
      activeStudents: Number(activeStudents.count),
      totalPayments: Number(paymentStats.count),
      totalRevenue: Number(paymentStats.total),
      totalTeachers: Number(totalTeachers.count),
    };
  }

  async getSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(systemSettings);
    const result: Record<string, string> = {};
    for (const row of rows) { if (row.key && row.value != null) result[row.key] = row.value; }
    return result;
  }

  async getSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return row?.value ?? null;
  }

  async setSettings(data: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await db.insert(systemSettings).values({ key, value }).onConflictDoUpdate({ target: systemSettings.key, set: { value, updatedAt: new Date() } });
    }
  }

  async getTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    return db.select().from(teacherMessages).where(eq(teacherMessages.teacherId, teacherId)).orderBy(desc(teacherMessages.createdAt));
  }

  async getAllTeacherMessages(): Promise<TeacherMessage[]> {
    return db.select().from(teacherMessages).orderBy(desc(teacherMessages.createdAt));
  }

  async createTeacherMessage(data: { id: string; teacherId: string; teacherName: string; message: string }): Promise<TeacherMessage> {
    const [msg] = await db.insert(teacherMessages).values(data).returning();
    return msg;
  }

  async replyToTeacherMessage(id: string, reply: string): Promise<TeacherMessage | undefined> {
    const [updated] = await db.update(teacherMessages).set({ reply, repliedAt: new Date(), isRead: false }).where(eq(teacherMessages.id, id)).returning();
    return updated;
  }

  async markMessageRead(id: string): Promise<void> {
    await db.update(teacherMessages).set({ isRead: true }).where(eq(teacherMessages.id, id));
  }

  async bulkDeleteMessages(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(teacherMessages).where(inArray(teacherMessages.id, ids));
  }

  async getTeacherStudentsFull(teacherName: string): Promise<Student[]> {
    return db.select().from(students).where(and(eq(students.teacherName, teacherName), eq(students.isDeleted, false))).orderBy(students.studentName);
  }

  async updateTeacherProfile(id: string, data: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [updated] = await db.update(teachers).set(data).where(eq(teachers.id, id)).returning();
    return updated;
  }

  async seedData(): Promise<void> {
    const existingCount = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.isDeleted, false));
    const count = Number(existingCount[0]?.count ?? 0);
    if (count >= 100) return;

    const adminExists = await this.getUserByUsername("admin");
    if (!adminExists) {
      await this.createUser({ username: "admin", password: "admin123", name: "مدير النظام", role: "admin", isActive: true });
    }

    const teachers_data = [
      { id: "c5c51268-c67e-4d35-ae21-ab0dc8e6d98c", name: "اسامة عبده قاسم", username: "12", password: "12", isActive: true, isDeleted: false },
      { id: "6902684c-8a84-4768-956d-ef0fbba5e21b", name: "عمران عقلان", username: "123", password: "123!@#", isActive: true, isDeleted: false },
      { id: "f0ede5f8-e3fe-40e4-951f-b5f6d6af1c16", name: "معمر عثلان", username: "11", password: "11", isActive: true, isDeleted: false },
      { id: "59b09e19-a557-45e2-9535-f9c5af1f7c0a", name: "ميمون", username: "778379776", password: "778379776", phone: "7778379776", isActive: true, isDeleted: false },
      { id: "d7ef7465-2a0b-4666-ab9e-8dddb6c56aee", name: "يسرى الراجحي", username: "13", password: "13", isActive: true, isDeleted: false },
    ];
    for (const t of teachers_data) {
      try { await db.insert(teachers).values(t).onConflictDoNothing(); } catch {}
    }

    const students_data = [
      { internalId: "e1378dd4", studentId: "20260101", studentName: "عبدالله السالم", studentPhone: "+966 51 152 3491", username: "Abdullah Alsalem", password: "Abud334455", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "Fixed", discountValue: 50, referredBy: "رضا طالب سنه 25", registrationDate: "2026-01-26", isActive: true, isDeleted: false },
      { internalId: "6abf923c", studentId: "20260102", studentName: "خالد الحارث", studentPhone: "+966 53 212 4521", username: "KHALID ALREFAEI", password: "Aassdd12A", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "شامل", subscriptionPrice: 200, discountType: "None", discountValue: 0, referredBy: "عبدالسالم", registrationDate: "2026-01-26", isActive: true, isDeleted: false },
      { internalId: "3081286a", studentId: "20260103", studentName: "عبدالعزيز العنزي", studentPhone: "+966 53 622 2127", username: "Abdulaziz#12", password: "Abdulaziz26-1", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "شامل", subscriptionPrice: 250, discountType: "Fixed", discountValue: 50, referredBy: "احمد اللحيمي", registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "303ea30b", studentId: "20260104", studentName: "عبدالعزيز خصم اعلان", studentPhone: "+966 55 336 7172", username: "ABDULAZIZ77", password: "1367Ag483636", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "b144fbcf", studentId: "20260105", studentName: "خالد الزاهرني", studentPhone: "+966 53 296 7305", username: "Khaled1", password: "Cr2006702", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "ae43d518", studentId: "20260107", studentName: "احمد الحيمي", studentPhone: "+966 55 161 9047", username: "Ahmed12#", password: "AL-Hayie23", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 250, discountType: "Fixed", discountValue: 50, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "27ca46c4", studentId: "20260108", studentName: "اخو فيصل", studentPhone: "+966 55 921 5297", username: "Fisal@4", password: "Ff@123456", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "b3da2a8a", studentId: "20260109", studentName: "البراء", studentPhone: "+966 53 430 7202", username: "baraa1", password: "Asd141414", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "cfa42891", studentId: "20260110", studentName: "نواف الجهني", studentPhone: "+966 54 982 7729", username: "_n7a2", password: "Nawaf_518", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "705e356e", studentId: "20260111", studentName: "فراس الجهني", studentPhone: "+966 55 883 2366", username: "Firas111", password: "Ff#123456789", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "2fe2ef90", studentId: "20260112", studentName: "أصيل العنيني", studentPhone: "+966 55 949 3373", username: "Asel#1", password: "Asel12345", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "73fa90b0", studentId: "20260113", studentName: "محمد الزبيدي", studentPhone: "+966 58 084 2358", username: "MOHAMMED#12", password: "Muammar123", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "14787728", studentId: "20260114", studentName: "عبدالمجيد طحلاوي", studentPhone: "+966 59 010 6615", username: "Abdalmged121", password: "Abdalmged1211", institution: "كلية ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "a2592067", studentId: "20260115", studentName: "عبدالرحمن الحمدي", studentPhone: "+966 58 230 7152", username: "Abdulrahman Alhamdi", password: "Am123456am", institution: "كلية ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "Fixed", discountValue: 100, referredBy: "البراء", registrationDate: "2026-01-28", isActive: true, isDeleted: false },
      { internalId: "2e3dfdd0", studentId: "20260116", studentName: "حسين بوجبارة", studentPhone: "+966 59 969 5373", username: "HussainBujbarah", password: "Hussain1122", institution: "كلية ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "Fixed", discountValue: 50, referredBy: "عبدالمجيد طحلاوي", registrationDate: "2026-01-28", isActive: true, isDeleted: false },
      { internalId: "88f3252b", studentId: "20260117", studentName: "احمد السناني", studentPhone: "+966 53 086 8139", username: "Ahmad@13", password: "ALjohani143", institution: "كلية ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-01-28", isActive: true, isDeleted: false },
      { internalId: "b504ec9f", studentId: "20260118", studentName: "اسامه العمري", studentPhone: "+966 58 262 4707", username: "sos", password: "Oossaa_07", institution: "معهد ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "Fixed", discountValue: 150, referredBy: "عبدالاله قديم", registrationDate: "2026-01-28", isActive: true, isDeleted: false },
      { internalId: "8bd85a30", studentId: "20260119", studentName: "نايف العلي", studentPhone: "+966 56 262 5866", username: "NAIF#12", password: "1367Ag483636", institution: "معهد ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionType: "شامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, referredBy: "راكان القحطاني", registrationDate: "2026-01-29", isActive: true, isDeleted: false },
      { internalId: "a27e938a", studentId: "20260120", studentName: "عبد المحسن", studentPhone: "+966 59 900 5721", username: "Abdalmohsen", password: "Aa1138746407", institution: "كلية ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, referredBy: "عبدالمجيد", registrationDate: "2026-01-29", isActive: true, isDeleted: false },
      { internalId: "90b6cd53", studentId: "20260121", studentName: "محمد بن بوجبارة", studentPhone: "+966 50 592 5374", username: "Mohammed tareq", password: "Qwaszx12$", institution: "كلية ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-29", isActive: true, isDeleted: false },
      { internalId: "e1e71446", studentId: "20260122", studentName: "كرار حسن", studentPhone: "+966 59 282 7507", username: "Krar Al sinan", password: "Krar1134307469", institution: "كلية ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-29", isActive: true, isDeleted: false },
      { internalId: "cd804307", studentId: "20260123", studentName: "عبدالرحمن جمعيان", studentPhone: "+966 50 157 2285", username: "abdulrahman#123", password: "Aljohani12", institution: "كلية ينبع", level: "تحضيري", teacherName: "اسامة عبده قاسم", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-29", isActive: true, isDeleted: false },
      { internalId: "b4d2976c", studentId: "20260124", studentName: "انس", studentPhone: "+966 54 456 2453", username: "Adalhadi#12", password: "Adalhadi123123", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-30", isActive: true, isDeleted: false },
      { internalId: "81d7d0f5", studentId: "20260125", studentName: "عبدالله بخاري", studentPhone: "+966 58 389 6362", username: "abudi67", password: "Ab0503565354", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-30", isActive: true, isDeleted: false },
      { internalId: "83fbc1bc", studentId: "20260126", studentName: "زياد طارق", studentPhone: "+966 54 651 5852", username: "mokazoozgo5@gmail.com", password: "Mokazoozgo518", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-30", isActive: true, isDeleted: false },
      { internalId: "fa850f31", studentId: "20260127", studentName: "جاسم الرمل", studentPhone: "+966 54 494 1788", username: "JasemAlramel", password: "J123@j123", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-31", isActive: true, isDeleted: false },
      { internalId: "616e6a02", studentId: "20260128", studentName: "رغد العيسي", studentPhone: "+966 54 766 4790", username: "raghad-11", password: "pizduj-bivjI1-waxnor", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-31", isActive: true, isDeleted: false },
      { internalId: "02a529f4", studentId: "20260129", studentName: "تميم الجهني", studentPhone: "+966 55 116 8187", username: "Tamim#123", password: "AlJuhani123", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-31", isActive: true, isDeleted: false },
      { internalId: "f5a6b794", studentId: "20260130", studentName: "ياسر الجهني", studentPhone: "+966 58 206 8161", username: "Yasser056", password: "Hend.2014", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, referredBy: "نايف العلي", registrationDate: "2026-02-03", isActive: true, isDeleted: false },
      { internalId: "cb253cbb", studentId: "20260131", studentName: "فرح", studentPhone: "+966 56 508 3056", username: "FarahIbrahim", password: "Farah5002ib", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-03", isActive: true, isDeleted: false },
      { internalId: "a80cf085", studentId: "20260132", studentName: "علي الموسي", studentPhone: "+966 56 166 4158", username: "Ali almosa", password: "Allawi12$", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-03", isActive: true, isDeleted: false },
      { internalId: "c060f128", studentId: "20260133", studentName: "راكان علي", studentPhone: "+966 55 575 0659", username: "Rakan123", password: "AlJuhani-123", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-03", isActive: true, isDeleted: false },
      { internalId: "5f3318d6", studentId: "20260134", studentName: "نواف الحربي", studentPhone: "+966 50 938 0152", username: "Nawaf2525", password: "Alharbi12341234", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 150, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "49251143", studentId: "20260135", studentName: "حياة الاء", studentPhone: "+966 59 160 7147", username: "Kinderr.skk", password: "Kk123456789K", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-04", isActive: true, isDeleted: false },
      { internalId: "23e324c5", studentId: "20260137", studentName: "الاء الجهني", studentPhone: "+966 56 729 4513", username: "Alaa-26", password: "Al-juhani12", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "Fixed", discountValue: 50, referredBy: "البراء", registrationDate: "2026-02-05", isActive: true, isDeleted: false },
      { internalId: "c4480232", studentId: "20260143", studentName: "ايمن", studentPhone: "+966 53 929 3422", username: "Ayman22", password: "Aa123Aa123", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-01-27", isActive: true, isDeleted: false },
      { internalId: "90e89711", studentId: "20260147", studentName: "حماد سرور", studentPhone: "+966 55 096 7586", username: "Hamed#1231", password: "Surur24-2", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "834ec089", studentId: "20260149", studentName: "احمد الوادعي", studentPhone: "+966 55 720 0475", username: "Ahmad Alwadai", password: "Aa12121212", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "545dc48d", studentId: "20260150", studentName: "حاتم سامي", studentPhone: "+966 54 350 0933", username: "HATEM-23", password: "ALjeraisy123", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "Fixed", discountValue: 50, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "007684a0", studentId: "20260151", studentName: "عبدالرحمن الشريف", studentPhone: "+966 56 850 7021", username: "AbduALrhman-26", password: "ALshreef123123", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "شامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "addea64c", studentId: "20260152", studentName: "الياس الشريف", studentPhone: "+966 50 938 0152", username: "EL10", password: "ELYAS56er", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "1738b2db", studentId: "20260153", studentName: "سعود الميطري", studentPhone: "+966 53 221 7337", username: "Saud Al-Mutairi", password: "Saud_2006", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "2e3bcd24", studentId: "20260154", studentName: "سعد مبارك", studentPhone: "+966 56 335 4047", username: "Saa-d", password: "Aa123456789", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 250, discountType: "Fixed", discountValue: 20, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "847ce824", studentId: "20260155", studentName: "اسماعيل نيازي", studentPhone: "+966 54 561 7175", username: "Ismael016", password: "Neyazi1300", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "608c00c5", studentId: "20260156", studentName: "حسام الحارثي", studentPhone: "+966 56 044 0879", username: "Hussam101", password: "Hsgh2020@", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 0, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "dd7f28e0", studentId: "20260157", studentName: "عبدالحكيم", studentPhone: "+966 55 804 8759", username: "Abdulhakim.102", password: "Maa-112233", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "be839f25", studentId: "20260158", studentName: "مهند الجهني", studentPhone: "+966 54 745 2517", username: "Muhannad123", password: "Al-jehani123", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "bb1a0aa6", studentId: "20260159", studentName: "عمر عبدالعزيز", studentPhone: "+966 53 889 3409", username: "Omar-123", password: "Abdulaziz123123", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-10", isActive: true, isDeleted: false },
      { internalId: "c9e06738", studentId: "20260160", studentName: "مشعل الصبحي", studentPhone: "+966 56 167 5002", username: "hfd.8", password: "Msh*123456", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-02-11", isActive: true, isDeleted: false },
      { internalId: "06ff055d", studentId: "20260161", studentName: "عبد الاعلى", studentPhone: "+966 56 362 5420", username: "1140506047", password: "Aboodi1423", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-11", isActive: true, isDeleted: false },
      { internalId: "c911dd2b", studentId: "20260162", studentName: "بدر الرشيدي", studentPhone: "+966 58 073 7879", username: "Bader 404", password: "Bader55pp", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, referredBy: "عبدالحكيم", registrationDate: "2026-02-11", isActive: true, isDeleted: false },
      { internalId: "26f85f29", studentId: "20260163", studentName: "عبدالمجيد  مدني", studentPhone: "+966 53 149 9241", username: "Abdulmajeed#12", password: "Tabbakh123123", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, referredBy: "سعود المطيري", registrationDate: "2026-02-11", isActive: true, isDeleted: false },
      { internalId: "fc479022", studentId: "20260164", studentName: "مالك جواد", studentPhone: "+966 59 350 8727", username: "Malikharbi77@gmail.com", password: "Malik123456@", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, referredBy: "مشعل الصبحي", registrationDate: "2026-02-11", isActive: true, isDeleted: false },
      { internalId: "7b30a66a", studentId: "20260165", studentName: "سعد سلمان", studentPhone: "+966 55 715 0983", username: "SaadAljohni", password: "mESHAL007", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "d74c2a7c", studentId: "20260166", studentName: "مهند العرفي", studentPhone: "+966 54 809 8606", username: "MHND", password: "Mohand606", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "6f1fd54c", studentId: "20260167", studentName: "مشعل ممدوح", studentPhone: "+966 53 666 5904", username: "Mishaalaljohani", password: "Mishaal@3214", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 299.98, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "1fe720ad", studentId: "20260168", studentName: "رئيف جواد", studentPhone: "+966 56 289 7401", username: "raef_", password: "Roofxd159", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "شامل", subscriptionPrice: 299.98, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "d5070f0d", studentId: "20260169", studentName: "متعب العنيزي", studentPhone: "+966 56 313 3205", username: "Muteb", password: "0563133205mmK", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "شامل", subscriptionPrice: 299.99, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "ade19eae", studentId: "20260170", studentName: "سديم العنيزي", studentPhone: "+966 56 898 4183", username: "Sadeem_2006", password: "SDsd_2006", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "3bcb626d", studentId: "20260171", studentName: "رهف", studentPhone: "+966 55 920 4945", username: "Rahafmarzouq", password: "1425Rei07", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 249.98, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "4c49a861", studentId: "20260172", studentName: "عزام جواد", studentPhone: "+966 50 242 6928", username: "Azzam alghamdi", password: "arab1234@", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "شامل", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "9a607d1c", studentId: "20260173", studentName: "تابع محمد فهد 1", studentPhone: "+966 54 976 5352", username: "MLALHAMED@icloud.com", password: "Mk@135790", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "18bbb261", studentId: "20260174", studentName: "تابع محمد فهد -2", studentPhone: "+966 54 976 5352", username: "Yunus", password: "Yy471600191", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "308ffeba", studentId: "20260175", studentName: "تابع محمد فهد -3", studentPhone: "+966 54 976 5352", username: "Faisal471600033", password: "Faisalkhattar", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 299.99, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "efc59541", studentId: "20260176", studentName: "يزن جواد", studentPhone: "+966 55 718 5858", username: "Yazan.111", password: "Aa11223344a", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 299.98, discountType: "None", discountValue: 0, referredBy: "عبدالحكيم", registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "f893a531", studentId: "20260177", studentName: "احمد جواد", studentPhone: "+966 50 414 5711", username: "Ahmed Balaraj", password: "Akob703703", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "b1703561", studentId: "20260178", studentName: "محمد جواد", studentPhone: "+966 50 791 9348", username: "Eng. Ahmed", password: "Aa1131931725@", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, referredBy: "مشعل الصبحي", registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "64dc1be8", studentId: "20260179", studentName: "الرفاعي جواد", studentPhone: "+966 54 556 9136", username: "Yamin_YIC77", password: "Yamenali1428", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 299.99, discountType: "None", discountValue: 0, referredBy: "احمد السناني", registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "7841c189", studentId: "20260180", studentName: "زائد جواد", studentPhone: "+966 50 141 3877", username: "Zyad57", password: "Shobily123", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 299.97, discountType: "None", discountValue: 0, referredBy: "نايف", registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "03ea618e", studentId: "20260181", studentName: "تركي اليحيوي", studentPhone: "+966 53 385 3230", username: "Y6M471600054@rcjy.edu.sa", password: "Stu@#1137278964", institution: "معهد ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 299.99, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "bf72fb8a", studentId: "20260182", studentName: "تركي جواد", studentPhone: "+966 58 147 3130", username: "Turki253", password: "MMmmNNnn05080", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 299.99, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "c637f2ad", studentId: "20260183", studentName: "محمد الاحمدي", studentPhone: "+966 55 035 1877", username: "Mohammedhhoo", password: "Bb17001700", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 299.99, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "adcb9629", studentId: "20260184", studentName: "رضوان جواد", studentPhone: "+966 56 997 6609", username: "Redwana546@gmail.com", password: "Ab1130306606", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "0800bada", studentId: "20260185", studentName: "حامد جواد", studentPhone: "+966 54 321 5016", username: "Ahmed H", password: "Ahm@71800", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 249.99, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "76e91ba4", studentId: "20260186", studentName: "خالد جواد", studentPhone: "+966 54 393 0835", username: "kh_h76", password: "Khaled3596", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "77582090", studentId: "20260187", studentName: "الحسن جواد", studentPhone: "+966 55 627 7229", username: "Alhassan34", password: "Aa11442299", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 299.98, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "ed230e5f", studentId: "20260188", studentName: "مهند جواد", studentPhone: "+966 54 351 2363", username: "Muahnned12", password: "Ahm@71787", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 299.98, discountType: "None", discountValue: 0, registrationDate: "2026-02-12", isActive: true, isDeleted: false },
      { internalId: "dfc43f16", studentId: "20260189", studentName: "فيصل عوض", studentPhone: "+966 59 235 0091", username: "faisal_2006", password: "ASasas@45", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-02-22", isActive: true, isDeleted: false },
      { internalId: "ee44e1da", studentId: "20260190", studentName: "اسامة الجهني", studentPhone: "+966 53 491 8574", username: "Osamaaljohani", password: "Osama15os", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 199.99, discountType: "None", discountValue: 0, registrationDate: "2026-02-22", isActive: true, isDeleted: false },
      { internalId: "f4d4a00a", studentId: "20260192", studentName: "ريان جواد", studentPhone: "+966 53 231 9851", username: "Ryan005", password: "Aa1234567", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 200.01, discountType: "None", discountValue: 0, registrationDate: "2026-02-22", isActive: true, isDeleted: false },
      { internalId: "4132383f", studentId: "20260193", studentName: "احمد الرشيدي", studentPhone: "+966 50 819 9092", username: "Ahmed234", password: "Stu@#1141852119", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-02-22", isActive: true, isDeleted: false },
      { internalId: "6b9eeaa4", studentId: "20260194", studentName: "خالد المشعلي", studentPhone: "+966 53 8565 050", username: "Abdulrahmann77", password: "Khalid.3242", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 150, discountType: "None", discountValue: 0, registrationDate: "2026-02-22", isActive: true, isDeleted: false },
      { internalId: "56b8a439", studentId: "20260195", studentName: "انس الجهني", studentPhone: "+966 58 3607 745", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 199.98, discountType: "None", discountValue: 0, registrationDate: "2026-02-22", isActive: false, isDeleted: false },
      { internalId: "cba6eb2f", studentId: "20260196", studentName: "محمد  ا لزاهرني", studentPhone: "+966 56 455 3152", username: "Alzahrani-34", password: "Alzahrani#234", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionType: "كامل", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-02-22", isActive: true, isDeleted: false },
      { internalId: "fc17bbc5", studentId: "20260197", studentName: "مازن جواد", studentPhone: "+966 56 995 5922", username: "MAZEN BAHOBIL", password: "Mazen23223", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionType: "كامل", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-02-22", isActive: true, isDeleted: false },
      { internalId: "8b13618e", studentId: "20260198", studentName: "محمد سمير", studentPhone: "+966 50 136 6730", username: "MOHAMMED SAMEER WARRAD", password: "Modi9842$", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-24", isActive: true, isDeleted: false },
      { internalId: "6f71752c", studentId: "20260199", studentName: "بدر الغامدي", studentPhone: "+966 50 897 4158", username: "Bader707", password: "maHtac-dirrig-vyzfe7", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-02-24", isActive: true, isDeleted: false },
      { internalId: "148c1599", studentId: "20260200", studentName: "انس جواد", studentPhone: "+966 55 255 6689", username: "anas bjn", password: "Sty@#1132345925", institution: "كلية ينبع", level: "تحضيري", teacherName: "معمر عثلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-24", isActive: true, isDeleted: false },
      { internalId: "1716b0d3", studentId: "20260201", studentName: "عبدالعزيز جواد", studentPhone: "+966 53 212 2826", username: "Abdulaziz.11", password: "As1123324", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "0c8ebcd4", studentId: "20260202", studentName: "الياسين جواد", studentPhone: "+966 57 854 0139", username: "471400807", password: "Admin1212", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "d81a97c3", studentId: "20260203", studentName: "عمر معمر", studentPhone: "+966 55 972 2243", username: "OMAR112288", password: "O112233o321o_1", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "40d4ab6c", studentId: "20260204", studentName: "علي الاحمراي", studentPhone: "+966 50 051 3015", username: "Ali10", password: "ALal12345", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "86ff745b", studentId: "20260205", studentName: "عمر جواد", studentPhone: "+966 58 016 2245", username: "omar_19", password: "Omaromar518.", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "1f4601de", studentId: "20260206", studentName: "ناصر جواد", studentPhone: "+966 55 767 9843", username: "il.qvi", password: "Naser$4965", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "dca83b0c", studentId: "20260207", studentName: "صالح جواد", studentPhone: "+966 56 611 0389", username: "rayan.aj", password: "RyAn8621@", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "5a760d51", studentId: "20260208", studentName: "حسين جواد", studentPhone: "+966 54 433 9139", username: "ox7pl", password: "Aa11223344Aa", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 299.98, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "2496d92c", studentId: "20260209", studentName: "عمر خالد", studentPhone: "+966 53 538 4261", username: "usy3", password: "Asd055990", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionType: "كامل", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "1a6f31b2", studentId: "20260210", studentName: "وسام  خالد", studentPhone: "+966 54 498 8260", username: "Wesam Alrehaili", password: "Wessam24!", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 249.99, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "7e6e94a1", studentId: "20260211", studentName: "افنان", studentPhone: "+966 53 931 2636", username: "Afiiine", password: "Rm123178!", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-25", isActive: true, isDeleted: false },
      { internalId: "5cbd6abc", studentId: "20260212", studentName: "ايوب صامطي", studentPhone: "+966 56 176 4110", username: "Ayoubsamti", password: "AYab8233@", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 200.01, discountType: "None", discountValue: 0, registrationDate: "2026-02-26", isActive: true, isDeleted: false },
      { internalId: "801f11f1", studentId: "20260213", studentName: "مشعل المشعلي", studentPhone: "+966 50 425 9240", username: "4714001214", password: "Asdfkkl518", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-26", isActive: true, isDeleted: false },
      { internalId: "b5bcf92c", studentId: "20260214", studentName: "حامد الجهني", studentPhone: "+966 58 186 5606", username: "HAMAD AL GIHANI", password: "Hamad471600155", institution: "معهد ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-27", isActive: true, isDeleted: false },
      { internalId: "ba18b882", studentId: "20260215", studentName: "امجد العامري", studentPhone: "+966 54 769 6443", username: "amjd37", password: "Amjdali3377", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 200, discountType: "None", discountValue: 0, registrationDate: "2026-02-27", isActive: true, isDeleted: false },
      { internalId: "83d4e8e0", studentId: "20260216", studentName: "عبدالاله سالم", studentPhone: "+966 50 464 5093", username: "Abood-1199", password: "Aa116699@", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-02-27", isActive: true, isDeleted: false },
      { internalId: "5df38da5", studentId: "20260217", studentName: "بدر المالكي", studentPhone: "+966 56 835 1781", username: "Bader.almalki", password: "Bb22$$4466", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-27", isActive: true, isDeleted: false },
      { internalId: "b6aefcd6", studentId: "20260218", studentName: "ريان الحربي", studentPhone: "+966 56 864 7134", username: "Rayan alhrbe", password: "Rayan0568647134", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-02-27", isActive: true, isDeleted: false },
      { internalId: "6cf9ab2b", studentId: "20260219", studentName: "زياد الجهني", studentPhone: "+966 50 723 6396", username: "zozo", password: "Ziad142729", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "19937433", studentId: "20260220", studentName: "مصطفى علي", studentPhone: "+966 58 178 7929", username: "Mustafaalessa63@gmail.com", password: "Mm123567@", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "6ad2da72", studentId: "20260221", studentName: "عبدالرحمن الزهراني", studentPhone: "+966 59 420 9005", username: "Abdulrahmanzh1", password: "#Qaq6diqm", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 299.99, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "b68b482f", studentId: "20260222", studentName: "محمد الياسري", studentPhone: "+966 50 227 8872", username: "Mohammedasiri", password: "Ll12m34a56ll", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "ae7c29e2", studentId: "20260223", studentName: "حمدان", studentPhone: "+966 56 083 7766", username: "Hamdan", password: "Hh20072007", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "c8920eaf", studentId: "20260224", studentName: "أمين الأهدل", studentPhone: "+966 54 001 7790", username: "Ameen123", password: "Amen@1428", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 250, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "7bc23d35", studentId: "20260225", studentName: "انس الرفاعي", studentPhone: "+966 58 360 7745", username: "Anas1099", password: "Anas1290ali", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 299.96, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "ST-1772384604771", studentId: "20260226", studentName: "وافي الخالدي", studentPhone: "+966 53 506 0819", username: "wa", password: "Maimod058@", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "ST-1772384861066", studentId: "20260227", studentName: "يونس الجهني", studentPhone: "+966 56 673 1487", username: "younes", password: "320976Yo@", institution: "معهد ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "ST-1772385168790", studentId: "20260228", studentName: "عبد العزيز الجهني", studentPhone: "+966 50 115 4850", username: "Abdulaziz-Aljohani", password: "Aa1139570350", institution: "كلية ينبع", level: "تحضيري", teacherName: "ميمون", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
      { internalId: "ST-1772387529629", studentId: "20260229", studentName: "ماث", studentPhone: "+966 56 078 2414", username: "Aa101011@", password: "bsama112233", institution: "كلية ينبع", level: "تحضيري", teacherName: "عمران عقلان", subscriptionPrice: 300, discountType: "None", discountValue: 0, registrationDate: "2026-03-01", isActive: true, isDeleted: false },
    ];

    for (const s of students_data) {
      try {
        await db.insert(students).values({ ...s, id: randomUUID() }).onConflictDoNothing();
      } catch {}
    }
  }

  async importStudents(studentsData: any[]): Promise<void> {
    // Instead of wiping everything, let's update existing or insert new
    const teacherNames = [...new Set(studentsData.map((s: any) => s.teacherName).filter(Boolean))];
    for (const name of teacherNames) {
      try { 
        await db.insert(teachers)
          .values({ id: randomUUID(), name: name as string, isActive: true, isDeleted: false })
          .onConflictDoUpdate({ target: teachers.name, set: { isActive: true, isDeleted: false } }); 
      } catch {}
    }

    for (const s of studentsData) {
      try {
        const studentValues = {
          internalId: s.internalId,
          studentId: s.studentId,
          studentName: s.studentName,
          studentPhone: s.studentPhone || null,
          username: s.username || null,
          password: s.password || null,
          institution: s.institution || null,
          level: s.level || "تحضيري",
          teacherName: s.teacherName || null,
          subscriptionType: s.subscriptionType || null,
          subscriptionPrice: s.subscriptionPrice || 0,
          discountType: s.discountType || "None",
          discountValue: s.discountValue || 0,
          referredBy: s.referredBy || null,
          referralCount: s.referralCount || 0,
          paymentDueDate: s.paymentDueDate || null,
          notes: s.notes || null,
          registrationDate: s.registrationDate || null,
          isActive: s.isActive !== false,
          isDeleted: false,
          lastUpdated: new Date().toISOString()
        };

        await db.insert(students)
          .values({ ...studentValues, id: randomUUID() })
          .onConflictDoUpdate({ 
            target: students.internalId, 
            set: studentValues 
          });
      } catch {}
    }
  }

  async wipeAllData(): Promise<void> {
    await db.delete(teacherMessages);
    await db.delete(teacherSalaries);
    await db.delete(payments);
    await db.delete(grades);
    await db.delete(students);
    await db.delete(teachers);
    await db.delete(users).where(sql`role != 'admin'`);
  }
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private teachers = new Map<string, Teacher>();
  private students = new Map<string, Student>();
  private grades = new Map<string, Grade>();
  private payments = new Map<string, Payment>();
  private settings = new Map<string, string>();
  private teacherMessages = new Map<string, TeacherMessage>();
  private salaries = new Map<string, TeacherSalary>();

  constructor() {
    this.seedData();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }
  async getUsers(): Promise<User[]> { return Array.from(this.users.values()); }
  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }
  async deleteUser(id: string): Promise<void> { this.users.delete(id); }

  async getTeachers(): Promise<Teacher[]> { return Array.from(this.teachers.values()).filter(t => !t.isDeleted); }
  async getTeacher(id: string): Promise<Teacher | undefined> { return this.teachers.get(id); }
  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const newTeacher: Teacher = { ...teacher, id, createdAt: new Date(), isDeleted: false, deletedAt: null, isActive: true } as Teacher;
    this.teachers.set(id, newTeacher);
    return newTeacher;
  }
  async updateTeacher(id: string, data: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const t = this.teachers.get(id);
    if (!t) return undefined;
    const updated = { ...t, ...data };
    this.teachers.set(id, updated as Teacher);
    return updated as Teacher;
  }
  async softDeleteTeacher(id: string): Promise<void> {
    const t = this.teachers.get(id);
    if (t) this.teachers.set(id, { ...t, isDeleted: true, deletedAt: new Date() });
  }
  async bulkDeleteTeachers(ids: string[]): Promise<void> {
    for (const id of ids) {
      const t = this.teachers.get(id);
      if (t) this.teachers.set(id, { ...t, isDeleted: true, deletedAt: new Date() });
    }
  }
  async getDeletedTeachers(): Promise<Teacher[]> { return Array.from(this.teachers.values()).filter(t => t.isDeleted); }
  async restoreTeacher(id: string): Promise<void> {
    const t = this.teachers.get(id);
    if (t) this.teachers.set(id, { ...t, isDeleted: false, deletedAt: null });
  }
  async permanentDeleteTeacher(id: string): Promise<void> { this.teachers.delete(id); }
  async syncTeacherUserAccount(teacher: Teacher): Promise<void> {
    const existing = await this.getUserByUsername(teacher.username!);
    if (!existing && teacher.username && teacher.password) {
      await this.createUser({ username: teacher.username, password: teacher.password, name: teacher.name, role: "teacher", isActive: true });
    }
  }
  async getTeacherStudents(teacherName: string): Promise<{ studentName: string; username: string | null; password: string | null; institution: string | null }[]> {
    return Array.from(this.students.values())
      .filter(s => s.teacherName === teacherName && !s.isDeleted)
      .map(s => ({ studentName: s.studentName, username: s.username, password: s.password, institution: s.institution }));
  }

  async getTeacherSalaries(teacherId?: string): Promise<TeacherSalary[]> {
    const all = Array.from(this.salaries.values());
    return teacherId ? all.filter(s => s.teacherId === teacherId) : all;
  }
  async createTeacherSalary(salary: InsertTeacherSalary): Promise<TeacherSalary> {
    const id = randomUUID();
    const newSalary: TeacherSalary = { ...salary, id, createdAt: new Date() };
    this.salaries.set(id, newSalary);
    return newSalary;
  }
  async updateTeacherSalary(id: string, data: Partial<InsertTeacherSalary>): Promise<TeacherSalary | undefined> {
    const s = this.salaries.get(id);
    if (!s) return undefined;
    const updated = { ...s, ...data };
    this.salaries.set(id, updated);
    return updated;
  }
  async deleteTeacherSalary(id: string): Promise<void> { this.salaries.delete(id); }

  async getStudents(search?: string): Promise<Student[]> {
    let all = Array.from(this.students.values()).filter(s => !s.isDeleted);
    if (search) {
      all = all.filter(s => s.studentName.includes(search) || s.studentId.includes(search));
    }
    return all;
  }
  async getStudent(id: string): Promise<Student | undefined> { return this.students.get(id); }
  async getStudentByInternalId(internalId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(s => s.internalId === internalId);
  }
  async getStudentByUsername(username: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(s => s.username === username);
  }
  async getStudentsByTeacher(teacherName: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => s.teacherName === teacherName && !s.isDeleted);
  }
  async getUnassignedStudents(): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => !s.teacherName && !s.isDeleted);
  }
  async createStudent(student: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const newStudent: Student = { ...student, id, createdAt: new Date(), isDeleted: false, deletedAt: null, isActive: true } as Student;
    this.students.set(id, newStudent);
    return newStudent;
  }
  async updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined> {
    const s = this.students.get(id);
    if (!s) return undefined;
    const updated = { ...s, ...data, lastUpdated: new Date().toISOString() };
    this.students.set(id, updated as Student);
    return updated as Student;
  }
  async softDeleteStudent(internalId: string): Promise<void> {
    const s = await this.getStudentByInternalId(internalId);
    if (s) this.updateStudent(s.id, { isDeleted: true, deletedAt: new Date(), isActive: false } as any);
  }
  async bulkDeleteStudents(internalIds: string[]): Promise<void> {
    for (const internalId of internalIds) {
      const s = await this.getStudentByInternalId(internalId);
      if (s) this.updateStudent(s.id, { isDeleted: true, deletedAt: new Date(), isActive: false } as any);
    }
  }
  async getDeletedStudents(): Promise<Student[]> { return Array.from(this.students.values()).filter(s => s.isDeleted); }
  async restoreStudent(internalId: string): Promise<void> {
    const s = await this.getStudentByInternalId(internalId);
    if (s) this.updateStudent(s.id, { isDeleted: false, deletedAt: null, isActive: true } as any);
  }
  async permanentDeleteStudent(internalId: string): Promise<void> {
    const s = await this.getStudentByInternalId(internalId);
    if (s) this.students.delete(s.id);
  }
  async emptyTrash(): Promise<void> {
    for (const [id, s] of this.students) if (s.isDeleted) this.students.delete(id);
    for (const [id, t] of this.teachers) if (t.isDeleted) this.teachers.delete(id);
    for (const [id, p] of this.payments) if (p.isDeleted) this.payments.delete(id);
  }

  async getAllGrades(): Promise<Grade[]> { return Array.from(this.grades.values()); }
  async getGradeByStudentInternalId(internalId: string): Promise<Grade | undefined> {
    return Array.from(this.grades.values()).find(g => g.internalId === internalId);
  }
  async upsertGrade(grade: InsertGrade): Promise<Grade> {
    const existing = await this.getGradeByStudentInternalId(grade.internalId);
    if (existing) {
      const updated = { ...existing, ...grade, updatedAt: new Date() };
      this.grades.set(existing.id, updated);
      return updated;
    }
    const id = randomUUID();
    const newGrade: Grade = { ...grade, id, createdAt: new Date(), updatedAt: new Date() } as Grade;
    this.grades.set(id, newGrade);
    return newGrade;
  }

  async getPayments(search?: string): Promise<Payment[]> {
    let all = Array.from(this.payments.values()).filter(p => !p.isDeleted);
    if (search) {
      all = all.filter(p => p.studentName?.includes(search) || p.studentId?.includes(search));
    }
    return all;
  }
  async getStudentPayments(internalId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.internalId === internalId && !p.isDeleted);
  }
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const newPayment: Payment = { ...payment, id, createdAt: new Date(), isDeleted: false, deletedAt: null } as Payment;
    this.payments.set(id, newPayment);
    return newPayment;
  }
  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const p = this.payments.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...data };
    this.payments.set(id, updated as Payment);
    return updated as Payment;
  }
  async softDeletePayment(id: string): Promise<void> {
    const p = this.payments.get(id);
    if (p) this.payments.set(id, { ...p, isDeleted: true, deletedAt: new Date() });
  }
  async bulkDeletePayments(ids: string[]): Promise<void> {
    for (const id of ids) {
      const p = this.payments.get(id);
      if (p) this.payments.set(id, { ...p, isDeleted: true, deletedAt: new Date() });
    }
  }
  async getDeletedPayments(): Promise<Payment[]> { return Array.from(this.payments.values()).filter(p => p.isDeleted); }
  async restorePayment(id: string): Promise<void> {
    const p = this.payments.get(id);
    if (p) this.payments.set(id, { ...p, isDeleted: false, deletedAt: null });
  }
  async permanentDeletePayment(id: string): Promise<void> { this.payments.delete(id); }

  async getDashboardStats(): Promise<{ totalStudents: number; activeStudents: number; totalPayments: number; totalRevenue: number; totalTeachers: number; }> {
    const allStudents = Array.from(this.students.values()).filter(s => !s.isDeleted);
    const allPayments = Array.from(this.payments.values()).filter(p => !p.isDeleted);
    return {
      totalStudents: allStudents.length,
      activeStudents: allStudents.filter(s => s.isActive).length,
      totalPayments: allPayments.length,
      totalRevenue: allPayments.reduce((acc, p) => acc + (p.amount || 0), 0),
      totalTeachers: Array.from(this.teachers.values()).filter(t => !t.isDeleted).length,
    };
  }
  async getNextStudentId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = Array.from(this.students.values()).length + 1;
    return `${currentYear}${count.toString().padStart(4, '0')}`;
  }
  async getPaymentStatsByReceiver(): Promise<{ receiverName: string; accountType: string; count: number; total: number }[]> {
    const stats = new Map<string, { receiverName: string; accountType: string; count: number; total: number }>();
    Array.from(this.payments.values()).filter(p => !p.isDeleted).forEach(p => {
      const key = `${p.receiverName}-${p.accountType}`;
      const current = stats.get(key) || { receiverName: p.receiverName || "Unknown", accountType: p.accountType || "Unknown", count: 0, total: 0 };
      stats.set(key, { ...current, count: current.count + 1, total: current.total + (p.amount || 0) });
    });
    return Array.from(stats.values());
  }
  async getStudentPaymentCounts(): Promise<{ 
    internalId: string; 
    studentName: string; 
    studentId: string; 
    institution: string; 
    teacherName: string;
    paymentCount: number; 
    totalPaid: number;
    subscriptionPrice: number;
    discountValue: number;
    remainingAmount: number;
    isFullyPaid: boolean;
  }[]> {
    return Array.from(this.students.values()).filter(s => !s.isDeleted).map(s => {
      const studentPayments = Array.from(this.payments.values()).filter(p => p.internalId === s.internalId && !p.isDeleted);
      const totalPaid = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const totalDue = (Number(s.subscriptionPrice) || 0) - (Number(s.discountValue) || 0);
      const remaining = Math.max(0, totalDue - totalPaid);
      
      return {
        internalId: s.internalId,
        studentName: s.studentName,
        studentId: s.studentId,
        institution: s.institution || "",
        teacherName: s.teacherName || "",
        paymentCount: studentPayments.length,
        totalPaid,
        subscriptionPrice: Number(s.subscriptionPrice) || 0,
        discountValue: Number(s.discountValue) || 0,
        remainingAmount: remaining,
        isFullyPaid: totalDue > 0 && totalPaid >= totalDue,
      };
    });
  }

  async getSettings(): Promise<Record<string, string>> {
    const res: Record<string, string> = {};
    this.settings.forEach((v, k) => res[k] = v);
    return res;
  }
  async getSetting(key: string): Promise<string | null> { return this.settings.get(key) || null; }
  async setSettings(data: Record<string, string>): Promise<void> {
    Object.entries(data).forEach(([k, v]) => this.settings.set(k, v));
  }

  async getTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    return Array.from(this.teacherMessages.values()).filter(m => m.teacherId === teacherId);
  }
  async getAllTeacherMessages(): Promise<TeacherMessage[]> { return Array.from(this.teacherMessages.values()); }
  async createTeacherMessage(data: { id: string; teacherId: string; teacherName: string; message: string }): Promise<TeacherMessage> {
    const newMessage: TeacherMessage = { ...data, reply: null, repliedAt: null, isRead: false, createdAt: new Date() };
    this.teacherMessages.set(data.id, newMessage);
    return newMessage;
  }
  async replyToTeacherMessage(id: string, reply: string): Promise<TeacherMessage | undefined> {
    const m = this.teacherMessages.get(id);
    if (!m) return undefined;
    const updated = { ...m, reply, repliedAt: new Date(), isRead: true };
    this.teacherMessages.set(id, updated);
    return updated;
  }
  async markMessageRead(id: string): Promise<void> {
    const m = this.teacherMessages.get(id);
    if (m) this.teacherMessages.set(id, { ...m, isRead: true });
  }
  async bulkDeleteMessages(ids: string[]): Promise<void> {
    for (const id of ids) this.teacherMessages.delete(id);
  }

  async getTeacherStudentsFull(teacherName: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => s.teacherName === teacherName && !s.isDeleted);
  }
  async updateTeacherProfile(id: string, data: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    return this.updateTeacher(id, data);
  }

  async seedData(): Promise<void> {
    this.createUser({ username: "admin", password: "123", name: "مدير النظام", role: "admin", isActive: true });
    this.createUser({ username: "staff", password: "123", name: "محمد بن عشق", role: "staff", isActive: true });

    const teachers_data = [
      { id: "c5c51268-c67e-4d35-ae21-ab0dc8e6d98c", name: "اسامة عبده قاسم", username: "12", password: "12", isActive: true, isDeleted: false },
      { id: "6902684c-8a84-4768-956d-ef0fbba5e21b", name: "عمران عقلان", username: "123", password: "123!@#", isActive: true, isDeleted: false },
      { id: "f0ede5f8-e3fe-40e4-951f-b5f6d6af1c16", name: "معمر عثلان", username: "11", password: "11", isActive: true, isDeleted: false },
      { id: "59b09e19-a557-45e2-9535-f9c5af1f7c0a", name: "ميمون", username: "778379776", password: "778379776", phone: "7778379776", isActive: true, isDeleted: false },
      { id: "d7ef7465-2a0b-4666-ab9e-8dddb6c56aee", name: "يسرى الراجحي", username: "13", password: "13", isActive: true, isDeleted: false },
    ];
    for (const t of teachers_data) {
      this.teachers.set(t.id, t as Teacher);
      this.syncTeacherUserAccount(t as Teacher);
    }
  }

  async importStudents(students: any[]): Promise<void> {
    const teacherNames = [...new Set(students.map((s: any) => s.teacherName).filter(Boolean))];
    for (const name of teacherNames) {
      const existing = Array.from(this.teachers.values()).find(t => t.name === name);
      if (!existing) {
        const id = randomUUID();
        this.teachers.set(id, { id, name: name as string, isActive: true, isDeleted: false, createdAt: new Date() } as Teacher);
      }
    }

    students.forEach(s => {
      const existing = Array.from(this.students.values()).find(curr => curr.internalId === s.internalId);
      if (existing) {
        this.students.set(existing.id, { ...existing, ...s, lastUpdated: new Date().toISOString() });
      } else {
        const id = randomUUID();
        this.students.set(id, { ...s, id, isDeleted: false, isActive: true, createdAt: new Date() } as Student);
      }
    });
  }

  async wipeAllData(): Promise<void> {
    this.students.clear();
    this.teachers.clear();
    this.payments.clear();
    this.grades.clear();
    this.teacherMessages.clear();
    this.salaries.clear();
    // Keep admin users
    for (const [id, user] of this.users) {
      if (user.role !== "admin") this.users.delete(id);
    }
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

