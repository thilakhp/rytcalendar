import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CourseForm } from "@/components/catalog/course-form";
import { createCourse } from "@/app/(app)/catalog/actions";

export default function NewCoursePage() {
  return (
    <>
      <PageHeader title="Add Training" />
      <Card className="max-w-3xl p-6">
        <CourseForm action={createCourse} cancelHref="/catalog" />
      </Card>
    </>
  );
}
