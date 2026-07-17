-- CreateTable
CREATE TABLE "task_runs" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_runs_run_id_key" ON "task_runs"("run_id");

-- CreateIndex
CREATE INDEX "task_runs_run_id_idx" ON "task_runs"("run_id");

-- CreateIndex
CREATE INDEX "task_runs_user_id_project_id_idx" ON "task_runs"("user_id", "project_id");
