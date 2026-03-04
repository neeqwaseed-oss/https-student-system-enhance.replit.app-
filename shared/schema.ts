import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "moderator", "staff", "teacher", "student"]);
export const discountTypeEnum = pgEnum("discount_type", ["None", "Fixed", "Percentage", "referral"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  permissions: text("permissions"),
  avatar: text("avatar"),
  background: text("background"),
  teacherId: varchar("teacher_id"),
  studentId: varchar("student_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  username: text("username").unique(),
  password: text("password"),
  phone: text("phone"),
  email: text("email"),
  subject: text("subject"),
  bio: text("bio"),
  avatar: text("avatar"),
  backgroundImage: text("background_image"),
  language: text("language").default("ar"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teacherMessages = pgTable("teacher_messages", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  teacherName: text("teacher_name"),
  message: text("message").notNull(),
  reply: text("reply"),
  repliedAt: timestamp("replied_at"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teacherSalaries = pgTable("teacher_salaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  amount: real("amount").notNull().default(0),
  paidDate: text("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  internalId: text("internal_id").notNull().unique(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  studentPhone: text("student_phone"),
  username: text("username"),
  password: text("password"),
  institution: text("institution"),
  level: text("level").default("تحضيري"),
  teacherName: text("teacher_name"),
  subscriptionType: text("subscription_type"),
  subscriptionPrice: real("subscription_price").default(0),
  discountType: text("discount_type").default("None"),
  discountValue: real("discount_value").default(0),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").default(0),
  paymentDueDate: text("payment_due_date"),
  notes: text("notes"),
  registrationDate: text("registration_date"),
  lastUpdated: text("last_updated"),
  isActive: boolean("is_active").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  internalId: text("internal_id").notNull().references(() => students.internalId, { onDelete: "cascade" }),
  studentId: text("student_id"),
  studentName: text("student_name"),
  windowsModel1: real("windows_model_1").default(0),
  windowsModel2: real("windows_model_2").default(0),
  wordModel1: real("word_model_1").default(0),
  wordModel2: real("word_model_2").default(0),
  wordModel3: real("word_model_3").default(0),
  wordModel4: real("word_model_4").default(0),
  excelModel1: real("excel_model_1").default(0),
  excelModel2: real("excel_model_2").default(0),
  excelModel3: real("excel_model_3").default(0),
  excelModel4: real("excel_model_4").default(0),
  excelModel5: real("excel_model_5").default(0),
  pptModel1: real("ppt_model_1").default(0),
  pptModel2: real("ppt_model_2").default(0),
  pptModel3: real("ppt_model_3").default(0),
  pptModel4: real("ppt_model_4").default(0),
  practiceQuizWord: real("practice_quiz_word").default(0),
  practiceQuizExcel: real("practice_quiz_excel").default(0),
  practiceQuizPowerpoint: real("practice_quiz_powerpoint").default(0),
  practiceMidterm: real("practice_midterm").default(0),
  practiceFinal: real("practice_final").default(0),
  practiceQuizWindows: real("practice_quiz_windows").default(0),
  practiceAssignment1: real("practice_assignment_1").default(0),
  practiceAssignment2: real("practice_assignment_2").default(0),
  quizWindows: real("quiz_windows").default(0),
  quizWord: real("quiz_word").default(0),
  quizExcel: real("quiz_excel").default(0),
  quizPowerpoint: real("quiz_powerpoint").default(0),
  midterm: real("midterm").default(0),
  final: real("final").default(0),
  assignment1: real("assignment_1").default(0),
  assignment2: real("assignment_2").default(0),
  gradeImages: text("grade_images"),
  gradeNotes: text("grade_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: text("payment_id").notNull().unique(),
  internalId: text("internal_id").notNull().references(() => students.internalId, { onDelete: "cascade" }),
  studentId: text("student_id"),
  studentName: text("student_name"),
  paymentDate: text("payment_date"),
  amount: real("amount").default(0),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  senderName: text("sender_name"),
  subscriptionType: text("subscription_type"),
  receiverName: text("receiver_name"),
  accountType: text("account_type"),
  paymentType: text("payment_type"),
  discountAmount: real("discount_amount").default(0),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true, createdAt: true, deletedAt: true });
export const insertTeacherMessageSchema = createInsertSchema(teacherMessages).omit({ id: true, createdAt: true, repliedAt: true });
export const insertTeacherSalarySchema = createInsertSchema(teacherSalaries).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, deletedAt: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, deletedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacherMessage = z.infer<typeof insertTeacherMessageSchema>;
export type TeacherMessage = typeof teacherMessages.$inferSelect;
export type InsertTeacherSalary = z.infer<typeof insertTeacherSalarySchema>;
export type TeacherSalary = typeof teacherSalaries.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
