import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CourseForm } from "@/components/catalog/course-form";
import { updateCourse } from "@/app/(app)/catalog/actions";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("training_courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  return (
    <>
      <PageHeader title={`Edit ${course.name}`} />
      <Card className="max-w-3xl p-6">
        <CourseForm
          course={course}
          action={updateCourse.bind(null, id)}
          cancelHref="/catalog"
        />
      </Card>
    </>
  );
}
