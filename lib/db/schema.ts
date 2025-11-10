import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  name: text("name"),
  displayName: text("display_name"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const thinkers = pgTable(
  "thinkers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    bioUrl: text("bio_url"),
    imageUrl: text("image_url"),
    thumbnailUrl: text("thumbnail_url"),
    description: text("description"),
    workCount: integer("work_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("thinkers_collection_slug_idx").on(
      table.collectionId,
      table.slug,
    ),
    index("thinkers_collection_idx").on(table.collectionId),
    index("thinkers_work_count_idx").on(table.workCount),
  ],
);

export const subjects = pgTable(
  "subjects",
  {
    id: serial("id").primaryKey(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("subjects_collection_name_idx").on(
      table.collectionId,
      table.name,
    ),
  ],
);

export const thinkerSubjects = pgTable(
  "thinker_subjects",
  {
    thinkerId: uuid("thinker_id")
      .notNull()
      .references(() => thinkers.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    workCount: integer("work_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.thinkerId, table.subjectId],
      name: "thinker_subjects_pk",
    }),
    index("thinker_subjects_subject_idx").on(table.subjectId),
  ],
);

export const works = pgTable(
  "works",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    thinkerId: uuid("thinker_id")
      .notNull()
      .references(() => thinkers.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id").references(() => subjects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    sourceHost: text("source_host"),
    publishedOn: date("published_on"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("works_thinker_idx").on(table.thinkerId),
    index("works_subject_idx").on(table.subjectId),
  ],
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    thinkerId: uuid("thinker_id")
      .notNull()
      .references(() => thinkers.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    sourceType: text("source_type").notNull(),
    url: text("url").notNull(),
    worksRoot: text("works_root"),
    priority: integer("priority").default(0).notNull(),
    notes: jsonb("notes").$type<string[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("sources_thinker_idx").on(table.thinkerId)],
);

export const zeroWorkReviews = pgTable("zero_work_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  thinkerId: uuid("thinker_id")
    .notNull()
    .references(() => thinkers.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  notes: text("notes"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const zeroWorkMatches = pgTable("zero_work_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => zeroWorkReviews.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  href: text("href"),
  url: text("url"),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const collectionRelations = relations(collections, ({ many }) => ({
  thinkers: many(thinkers),
  subjects: many(subjects),
}));

export const thinkerRelations = relations(thinkers, ({ one, many }) => ({
  collection: one(collections, {
    fields: [thinkers.collectionId],
    references: [collections.id],
  }),
  subjects: many(thinkerSubjects),
  works: many(works),
  sources: many(sources),
  zeroWorkReviews: many(zeroWorkReviews),
}));

export const subjectRelations = relations(subjects, ({ one, many }) => ({
  collection: one(collections, {
    fields: [subjects.collectionId],
    references: [collections.id],
  }),
  thinkerSubjects: many(thinkerSubjects),
  works: many(works),
}));

export const thinkerSubjectRelations = relations(thinkerSubjects, ({ one }) => ({
  thinker: one(thinkers, {
    fields: [thinkerSubjects.thinkerId],
    references: [thinkers.id],
  }),
  subject: one(subjects, {
    fields: [thinkerSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const workRelations = relations(works, ({ one }) => ({
  thinker: one(thinkers, {
    fields: [works.thinkerId],
    references: [thinkers.id],
  }),
  subject: one(subjects, {
    fields: [works.subjectId],
    references: [subjects.id],
  }),
}));

export const sourceRelations = relations(sources, ({ one }) => ({
  thinker: one(thinkers, {
    fields: [sources.thinkerId],
    references: [thinkers.id],
  }),
}));

export const zeroWorkReviewRelations = relations(zeroWorkReviews, ({ one, many }) => ({
  thinker: one(thinkers, {
    fields: [zeroWorkReviews.thinkerId],
    references: [thinkers.id],
  }),
  matches: many(zeroWorkMatches),
}));

export const zeroWorkMatchRelations = relations(zeroWorkMatches, ({ one }) => ({
  review: one(zeroWorkReviews, {
    fields: [zeroWorkMatches.reviewId],
    references: [zeroWorkReviews.id],
  }),
}));

