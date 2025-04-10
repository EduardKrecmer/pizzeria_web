import { pgTable, text, serial, integer, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pizzas = pgTable("pizzas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  image: text("image").notNull(),
  tags: text("tags").array().notNull(),
  ingredients: text("ingredients").array().notNull(),
  weight: text("weight"),
  allergens: text("allergens")
});

export const extras = pgTable("extras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: text("delivery_city").notNull(),
  deliveryPostalCode: text("delivery_postal_code").notNull(),
  deliveryType: text("delivery_type").notNull().default('DELIVERY'),
  deliveryFee: doublePrecision("delivery_fee").default(0),
  notes: text("notes"),
  items: jsonb("items").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: text("created_at").notNull()
});

export const insertPizzaSchema = createInsertSchema(pizzas).omit({
  id: true
});

export const insertExtrasSchema = createInsertSchema(extras).omit({
  id: true
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  status: true,
  createdAt: true
});

export type Pizza = typeof pizzas.$inferSelect;
export type InsertPizza = z.infer<typeof insertPizzaSchema> & {
  weight?: string | null;
  allergens?: string | null;
};

export type Extra = typeof extras.$inferSelect;
export type InsertExtra = z.infer<typeof insertExtrasSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
