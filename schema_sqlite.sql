PRAGMA foreign_keys = ON;

CREATE TABLE "project" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_projects_id" PRIMARY KEY ("id")
);

CREATE TABLE "requirement_source" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "project_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL CHECK ("kind" IN ('xlsx', 'pdf', 'markdown', 'text', 'json', 'docx', 'other')),
    "original_filename" VARCHAR(500),
    "original_uri" TEXT,
    "storage_uri" TEXT,
    "mime_type" VARCHAR(255),
    "checksum" VARCHAR(128),
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirement_sources_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_requirement_source_project_id_project_id" FOREIGN KEY ("project_id") REFERENCES "project" ("id")
);

CREATE TABLE "requirement_extraction_run" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "requirement_source_id" TEXT NOT NULL,
    "requirement_type" TEXT NOT NULL CHECK ("requirement_type" IN ('business', 'functional', 'non_functional', 'code_quality', 'compliance', 'security', 'testing', 'architecture', 'performance', 'other')),
    "status" TEXT NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    "agent_name" VARCHAR(255),
    "model_name" VARCHAR(255),
    "config" TEXT CHECK ("config" IS NULL OR json_valid("config")),
    "error_message" TEXT,
    "started_at" TEXT,
    "completed_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirement_extraction_runs_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_requirement_extraction_run_requirement_source_id_requirem" FOREIGN KEY ("requirement_source_id") REFERENCES "requirement_source" ("id")
);

CREATE TABLE "requirement_candidate" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "project_id" TEXT NOT NULL,
    "requirement_source_id" TEXT NOT NULL,
    "extraction_run_id" TEXT NOT NULL,
    "label" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'unspecified' CHECK ("priority" IN ('critical', 'high', 'medium', 'low', 'unspecified')),
    "type" TEXT NOT NULL CHECK ("type" IN ('business', 'functional', 'non_functional', 'code_quality', 'compliance', 'security', 'testing', 'architecture', 'performance', 'other')),
    "origin" TEXT,
    "raw_content" TEXT,
    "source_locator" TEXT CHECK ("source_locator" IS NULL OR json_valid("source_locator")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirement_candidates_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_requirement_candidate_project_id_project_id" FOREIGN KEY ("project_id") REFERENCES "project" ("id"),
    CONSTRAINT "fk_requirement_candidate_requirement_source_id_requirement_s" FOREIGN KEY ("requirement_source_id") REFERENCES "requirement_source" ("id"),
    CONSTRAINT "fk_requirement_candidate_extraction_run_id_requirement_extra" FOREIGN KEY ("extraction_run_id") REFERENCES "requirement_extraction_run" ("id")
);

CREATE TABLE "requirement_candidate_embedding" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "requirement_candidate_id" TEXT NOT NULL,
    "embedding_model" VARCHAR(255) NOT NULL,
    "embedding" TEXT NOT NULL CHECK (json_valid("embedding") AND json_type("embedding") = 'array'),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirement_candidate_embeddings_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_requirement_candidate_embedding_requirement_candidate_id_" FOREIGN KEY ("requirement_candidate_id") REFERENCES "requirement_candidate" ("id")
);

CREATE TABLE "requirement_dedup_run" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "project_id" TEXT NOT NULL,
    "strategy" TEXT NOT NULL CHECK ("strategy" IN ('vector_cosine', 'llm', 'merged')),
    "status" TEXT NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    "input_run_ids" TEXT CHECK ("input_run_ids" IS NULL OR json_valid("input_run_ids")),
    "config" TEXT CHECK ("config" IS NULL OR json_valid("config")),
    "error_message" TEXT,
    "started_at" TEXT,
    "completed_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirement_dedup_runs_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_requirement_dedup_run_project_id_project_id" FOREIGN KEY ("project_id") REFERENCES "project" ("id")
);

CREATE TABLE "requirement_dedup_pair" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "dedup_run_id" TEXT NOT NULL,
    "candidate_a_id" TEXT NOT NULL,
    "candidate_b_id" TEXT NOT NULL,
    "similarity_score" NUMERIC,
    "decision" TEXT NOT NULL CHECK ("decision" IN ('duplicate', 'not_duplicate', 'uncertain')),
    "reasoning" TEXT,
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirement_dedup_pairs_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_requirement_dedup_pair_dedup_run_id_requirement_dedup_run" FOREIGN KEY ("dedup_run_id") REFERENCES "requirement_dedup_run" ("id"),
    CONSTRAINT "fk_requirement_dedup_pair_candidate_a_id_requirement_candida" FOREIGN KEY ("candidate_a_id") REFERENCES "requirement_candidate" ("id"),
    CONSTRAINT "fk_requirement_dedup_pair_candidate_b_id_requirement_candida" FOREIGN KEY ("candidate_b_id") REFERENCES "requirement_candidate" ("id")
);

CREATE TABLE "requirement_set" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "project_id" TEXT NOT NULL,
    "dedup_run_id" TEXT,
    "version" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 0 CHECK ("is_active" IN (0, 1)),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirement_sets_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_requirement_set_project_id_project_id" FOREIGN KEY ("project_id") REFERENCES "project" ("id"),
    CONSTRAINT "fk_requirement_set_dedup_run_id_requirement_dedup_run_id" FOREIGN KEY ("dedup_run_id") REFERENCES "requirement_dedup_run" ("id")
);

CREATE TABLE "requirement" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "requirement_set_id" TEXT NOT NULL,
    "label" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'unspecified' CHECK ("priority" IN ('critical', 'high', 'medium', 'low', 'unspecified')),
    "type" TEXT NOT NULL CHECK ("type" IN ('business', 'functional', 'non_functional', 'code_quality', 'compliance', 'security', 'testing', 'architecture', 'performance', 'other')),
    "origin" TEXT,
    "raw_content" TEXT,
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirements_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_requirement_requirement_set_id_requirement_set_id" FOREIGN KEY ("requirement_set_id") REFERENCES "requirement_set" ("id")
);

CREATE TABLE "requirement_candidate_link" (
    "requirement_id" TEXT NOT NULL,
    "requirement_candidate_id" TEXT NOT NULL,
    "is_primary" INTEGER NOT NULL DEFAULT 0 CHECK ("is_primary" IN (0, 1)),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_requirement_candidate_links_requirement_id_requirement_candidate_id" PRIMARY KEY ("requirement_id", "requirement_candidate_id"),
    CONSTRAINT "fk_requirement_candidate_link_requirement_id_requirement_id" FOREIGN KEY ("requirement_id") REFERENCES "requirement" ("id"),
    CONSTRAINT "fk_requirement_candidate_link_requirement_candidate_id_requi" FOREIGN KEY ("requirement_candidate_id") REFERENCES "requirement_candidate" ("id")
);

CREATE TABLE "codebase" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "source_type" TEXT NOT NULL CHECK ("source_type" IN ('git', 'upload')),
    "repository_url" TEXT,
    "default_branch" VARCHAR(255),
    "credential_ref" TEXT,
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_codebases_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_codebase_project_id_project_id" FOREIGN KEY ("project_id") REFERENCES "project" ("id")
);

CREATE TABLE "code_ingestion_run" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "codebase_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    "config" TEXT CHECK ("config" IS NULL OR json_valid("config")),
    "error_message" TEXT,
    "started_at" TEXT,
    "completed_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_code_ingestion_runs_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_code_ingestion_run_codebase_id_codebase_id" FOREIGN KEY ("codebase_id") REFERENCES "codebase" ("id")
);

CREATE TABLE "code_snapshot" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "codebase_id" TEXT NOT NULL,
    "ingestion_run_id" TEXT,
    "branch" VARCHAR(255),
    "commit_sha" VARCHAR(128),
    "storage_uri" TEXT,
    "checksum" VARCHAR(128),
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_code_snapshots_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_code_snapshot_codebase_id_codebase_id" FOREIGN KEY ("codebase_id") REFERENCES "codebase" ("id"),
    CONSTRAINT "fk_code_snapshot_ingestion_run_id_code_ingestion_run_id" FOREIGN KEY ("ingestion_run_id") REFERENCES "code_ingestion_run" ("id")
);

CREATE TABLE "code_file" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "code_snapshot_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "language" VARCHAR(100),
    "checksum" VARCHAR(128),
    "size_bytes" INTEGER,
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_code_files_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_code_file_code_snapshot_id_code_snapshot_id" FOREIGN KEY ("code_snapshot_id") REFERENCES "code_snapshot" ("id")
);

CREATE TABLE "code_chunk" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "code_file_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "start_line" INTEGER,
    "end_line" INTEGER,
    "symbol_name" VARCHAR(500),
    "content" TEXT NOT NULL,
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_code_chunks_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_code_chunk_code_file_id_code_file_id" FOREIGN KEY ("code_file_id") REFERENCES "code_file" ("id")
);

CREATE TABLE "code_chunk_embedding" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "code_chunk_id" TEXT NOT NULL,
    "embedding_model" VARCHAR(255) NOT NULL,
    "embedding" TEXT NOT NULL CHECK (json_valid("embedding") AND json_type("embedding") = 'array'),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_code_chunk_embeddings_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_code_chunk_embedding_code_chunk_id_code_chunk_id" FOREIGN KEY ("code_chunk_id") REFERENCES "code_chunk" ("id")
);

CREATE TABLE "validation_run" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "project_id" TEXT NOT NULL,
    "requirement_set_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    "config" TEXT CHECK ("config" IS NULL OR json_valid("config")),
    "error_message" TEXT,
    "started_at" TEXT,
    "completed_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_validation_runs_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_validation_run_project_id_project_id" FOREIGN KEY ("project_id") REFERENCES "project" ("id"),
    CONSTRAINT "fk_validation_run_requirement_set_id_requirement_set_id" FOREIGN KEY ("requirement_set_id") REFERENCES "requirement_set" ("id")
);

CREATE TABLE "validation_run_code_snapshot" (
    "validation_run_id" TEXT NOT NULL,
    "code_snapshot_id" TEXT NOT NULL,
CONSTRAINT "pk_validation_run_code_snapshots_validation_run_id_code_snapshot_id" PRIMARY KEY ("validation_run_id", "code_snapshot_id"),
    CONSTRAINT "fk_validation_run_code_snapshot_validation_run_id_validation" FOREIGN KEY ("validation_run_id") REFERENCES "validation_run" ("id"),
    CONSTRAINT "fk_validation_run_code_snapshot_code_snapshot_id_code_snapsh" FOREIGN KEY ("code_snapshot_id") REFERENCES "code_snapshot" ("id")
);

CREATE TABLE "validation_agent_run" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "validation_run_id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL CHECK ("agent_type" IN ('requirements_implementation', 'requirements_tests', 'implementation_tests')),
    "status" TEXT NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    "agent_name" VARCHAR(255),
    "model_name" VARCHAR(255),
    "config" TEXT CHECK ("config" IS NULL OR json_valid("config")),
    "raw_output" TEXT CHECK ("raw_output" IS NULL OR json_valid("raw_output")),
    "error_message" TEXT,
    "started_at" TEXT,
    "completed_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_validation_agent_runs_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_validation_agent_run_validation_run_id_validation_run_id" FOREIGN KEY ("validation_run_id") REFERENCES "validation_run" ("id")
);

CREATE TABLE "finding" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "validation_run_id" TEXT NOT NULL,
    "validation_agent_run_id" TEXT,
    "label" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL CHECK ("severity" IN ('critical', 'high', 'medium', 'low', 'info')),
    "type" TEXT NOT NULL CHECK ("type" IN ('requirements_implementation', 'requirements_tests', 'implementation_tests')),
    "solution_proposal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'accepted', 'dismissed', 'resolved')),
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_findings_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_finding_validation_run_id_validation_run_id" FOREIGN KEY ("validation_run_id") REFERENCES "validation_run" ("id"),
    CONSTRAINT "fk_finding_validation_agent_run_id_validation_agent_run_id" FOREIGN KEY ("validation_agent_run_id") REFERENCES "validation_agent_run" ("id")
);

CREATE TABLE "finding_requirement" (
    "finding_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "explanation" TEXT,
CONSTRAINT "pk_finding_requirements_finding_id_requirement_id" PRIMARY KEY ("finding_id", "requirement_id"),
    CONSTRAINT "fk_finding_requirement_finding_id_finding_id" FOREIGN KEY ("finding_id") REFERENCES "finding" ("id"),
    CONSTRAINT "fk_finding_requirement_requirement_id_requirement_id" FOREIGN KEY ("requirement_id") REFERENCES "requirement" ("id")
);

CREATE TABLE "finding_location" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "finding_id" TEXT NOT NULL,
    "code_file_id" TEXT,
    "code_chunk_id" TEXT,
    "location_type" TEXT NOT NULL CHECK ("location_type" IN ('implementation', 'test', 'configuration', 'documentation', 'other')),
    "start_line" INTEGER,
    "end_line" INTEGER,
    "symbol_name" VARCHAR(500),
    "explanation" TEXT,
    "code_excerpt" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_finding_locations_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_finding_location_finding_id_finding_id" FOREIGN KEY ("finding_id") REFERENCES "finding" ("id"),
    CONSTRAINT "fk_finding_location_code_file_id_code_file_id" FOREIGN KEY ("code_file_id") REFERENCES "code_file" ("id"),
    CONSTRAINT "fk_finding_location_code_chunk_id_code_chunk_id" FOREIGN KEY ("code_chunk_id") REFERENCES "code_chunk" ("id")
);

CREATE TABLE "report" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "validation_run_id" TEXT NOT NULL UNIQUE,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'final', 'archived')),
    "summary_data" TEXT CHECK ("summary_data" IS NULL OR json_valid("summary_data")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_reports_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_report_validation_run_id_validation_run_id" FOREIGN KEY ("validation_run_id") REFERENCES "validation_run" ("id")
);

CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "project_id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL CHECK ("actor_type" IN ('user', 'system', 'agent')),
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "before_data" TEXT CHECK ("before_data" IS NULL OR json_valid("before_data")),
    "after_data" TEXT CHECK ("after_data" IS NULL OR json_valid("after_data")),
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_audit_events_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_audit_events_project_id_project_id" FOREIGN KEY ("project_id") REFERENCES "project" ("id")
);

CREATE TABLE "report_export" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "report_id" TEXT NOT NULL,
    "format" TEXT NOT NULL CHECK ("format" IN ('markdown', 'pdf', 'html')),
    "storage_uri" TEXT,
    "checksum" VARCHAR(128),
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_report_exports_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_report_export_report_id_report_id" FOREIGN KEY ("report_id") REFERENCES "report" ("id")
);

CREATE TABLE "developer_prompt" (
    "id" TEXT NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-4' ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', (random() & 3) + 1, 1) ||
        substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    "report_id" TEXT NOT NULL,
    "title" VARCHAR(500),
    "description" TEXT,
    "content" TEXT NOT NULL,
    "target" VARCHAR(100),
    "metadata" TEXT CHECK ("metadata" IS NULL OR json_valid("metadata")),
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "pk_developer_prompts_id" PRIMARY KEY ("id"),
    CONSTRAINT "fk_developer_prompt_report_id_report_id" FOREIGN KEY ("report_id") REFERENCES "report" ("id")
);

CREATE TABLE "developer_prompt_finding" (
    "developer_prompt_id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
CONSTRAINT "pk_developer_prompt_findings_developer_prompt_id_finding_id" PRIMARY KEY ("developer_prompt_id", "finding_id"),
    CONSTRAINT "fk_developer_prompt_finding_developer_prompt_id_developer_pr" FOREIGN KEY ("developer_prompt_id") REFERENCES "developer_prompt" ("id"),
    CONSTRAINT "fk_developer_prompt_finding_finding_id_finding_id" FOREIGN KEY ("finding_id") REFERENCES "finding" ("id")
);

-- Indexes
CREATE INDEX "project_idx_projects_name" ON "project" ("name");
CREATE INDEX "requirement_source_idx_requirement_sources_project_id" ON "requirement_source" ("project_id");
CREATE INDEX "requirement_source_idx_requirement_sources_checksum" ON "requirement_source" ("checksum");
CREATE INDEX "idx_requirement_extraction_runs_requirement_source_id" ON "requirement_extraction_run" ("requirement_source_id");
CREATE INDEX "idx_requirement_extraction_runs_status" ON "requirement_extraction_run" ("status");
CREATE INDEX "requirement_candidate_idx_requirement_candidates_project_id" ON "requirement_candidate" ("project_id");
CREATE INDEX "idx_requirement_candidates_requirement_source_id" ON "requirement_candidate" ("requirement_source_id");
CREATE INDEX "idx_requirement_candidates_extraction_run_id" ON "requirement_candidate" ("extraction_run_id");
CREATE INDEX "requirement_candidate_idx_requirement_candidates_type" ON "requirement_candidate" ("type");
CREATE INDEX "idx_requirement_candidate_embeddings_requirement_candidate_i" ON "requirement_candidate_embedding" ("requirement_candidate_id");
CREATE INDEX "requirement_dedup_run_idx_requirement_dedup_runs_project_id" ON "requirement_dedup_run" ("project_id");
CREATE INDEX "requirement_dedup_run_idx_requirement_dedup_runs_strategy" ON "requirement_dedup_run" ("strategy");
CREATE INDEX "requirement_dedup_run_idx_requirement_dedup_runs_status" ON "requirement_dedup_run" ("status");
CREATE INDEX "idx_requirement_dedup_pairs_dedup_run_id" ON "requirement_dedup_pair" ("dedup_run_id");
CREATE INDEX "idx_requirement_dedup_pairs_candidate_a_id" ON "requirement_dedup_pair" ("candidate_a_id");
CREATE INDEX "idx_requirement_dedup_pairs_candidate_b_id" ON "requirement_dedup_pair" ("candidate_b_id");
CREATE UNIQUE INDEX "idx_requirement_dedup_pairs_dedup_run_id_candidate_a_id_cand" ON "requirement_dedup_pair" ("dedup_run_id", "candidate_a_id", "candidate_b_id");
CREATE INDEX "requirement_set_idx_requirement_sets_project_id" ON "requirement_set" ("project_id");
CREATE UNIQUE INDEX "requirement_set_idx_requirement_sets_project_id_version" ON "requirement_set" ("project_id", "version");
CREATE INDEX "requirement_idx_requirements_requirement_set_id" ON "requirement" ("requirement_set_id");
CREATE INDEX "requirement_idx_requirements_type" ON "requirement" ("type");
CREATE INDEX "requirement_idx_requirements_priority" ON "requirement" ("priority");
CREATE INDEX "idx_requirement_candidate_links_requirement_candidate_id" ON "requirement_candidate_link" ("requirement_candidate_id");
CREATE INDEX "codebase_idx_codebases_project_id" ON "codebase" ("project_id");
CREATE INDEX "code_ingestion_run_idx_code_ingestion_runs_codebase_id" ON "code_ingestion_run" ("codebase_id");
CREATE INDEX "code_ingestion_run_idx_code_ingestion_runs_status" ON "code_ingestion_run" ("status");
CREATE INDEX "code_snapshot_idx_code_snapshots_codebase_id" ON "code_snapshot" ("codebase_id");
CREATE INDEX "code_snapshot_idx_code_snapshots_commit_sha" ON "code_snapshot" ("commit_sha");
CREATE INDEX "code_snapshot_idx_code_snapshots_checksum" ON "code_snapshot" ("checksum");
CREATE INDEX "code_file_idx_code_files_code_snapshot_id" ON "code_file" ("code_snapshot_id");
CREATE UNIQUE INDEX "code_file_idx_code_files_code_snapshot_id_path" ON "code_file" ("code_snapshot_id", "path");
CREATE INDEX "code_chunk_idx_code_chunks_code_file_id" ON "code_chunk" ("code_file_id");
CREATE UNIQUE INDEX "code_chunk_idx_code_chunks_code_file_id_chunk_index" ON "code_chunk" ("code_file_id", "chunk_index");
CREATE INDEX "code_chunk_embedding_idx_code_chunk_embeddings_code_chunk_id" ON "code_chunk_embedding" ("code_chunk_id");
CREATE INDEX "validation_run_idx_validation_runs_project_id" ON "validation_run" ("project_id");
CREATE INDEX "validation_run_idx_validation_runs_requirement_set_id" ON "validation_run" ("requirement_set_id");
CREATE INDEX "validation_run_idx_validation_runs_status" ON "validation_run" ("status");
CREATE INDEX "idx_validation_run_code_snapshots_code_snapshot_id" ON "validation_run_code_snapshot" ("code_snapshot_id");
CREATE INDEX "idx_validation_agent_runs_validation_run_id" ON "validation_agent_run" ("validation_run_id");
CREATE INDEX "validation_agent_run_idx_validation_agent_runs_agent_type" ON "validation_agent_run" ("agent_type");
CREATE INDEX "validation_agent_run_idx_validation_agent_runs_status" ON "validation_agent_run" ("status");
CREATE INDEX "finding_idx_findings_validation_run_id" ON "finding" ("validation_run_id");
CREATE INDEX "finding_idx_findings_validation_agent_run_id" ON "finding" ("validation_agent_run_id");
CREATE INDEX "finding_idx_findings_severity" ON "finding" ("severity");
CREATE INDEX "finding_idx_findings_status" ON "finding" ("status");
CREATE INDEX "finding_idx_findings_type" ON "finding" ("type");
CREATE INDEX "finding_requirement_idx_finding_requirements_requirement_id" ON "finding_requirement" ("requirement_id");
CREATE INDEX "finding_location_idx_finding_locations_finding_id" ON "finding_location" ("finding_id");
CREATE INDEX "finding_location_idx_finding_locations_code_file_id" ON "finding_location" ("code_file_id");
CREATE INDEX "finding_location_idx_finding_locations_code_chunk_id" ON "finding_location" ("code_chunk_id");
CREATE INDEX "audit_events_idx_audit_events_project_id" ON "audit_events" ("project_id");
CREATE INDEX "audit_events_idx_audit_events_entity_type_entity_id" ON "audit_events" ("entity_type", "entity_id");
CREATE INDEX "audit_events_idx_audit_events_created_at" ON "audit_events" ("created_at");
CREATE INDEX "report_export_idx_report_exports_report_id" ON "report_export" ("report_id");
CREATE INDEX "report_export_idx_report_exports_format" ON "report_export" ("format");
CREATE INDEX "developer_prompt_idx_developer_prompts_report_id" ON "developer_prompt" ("report_id");
CREATE INDEX "idx_developer_prompt_findings_finding_id" ON "developer_prompt_finding" ("finding_id");
