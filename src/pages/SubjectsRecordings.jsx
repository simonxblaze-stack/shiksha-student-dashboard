import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SubjectCard from "../components/SubjectCard";
import PageHeader from "../components/PageHeader";
import api from "../api/apiClient";
import { useCourse } from "../contexts/CourseContext";
import "../styles/subjects.css";

export default function SubjectsRecordings() {
  const navigate = useNavigate();
  const { activeCourse } = useCourse();

  const [subjectData, setSubjectData] = useState([]);

  useEffect(() => {
    if (!activeCourse) return;

    const fetchSubjects = async () => {
      try {
        const res = await api.get(`/courses/${activeCourse.id}/subjects/`);
        setSubjectData(res.data || []);
      } catch (err) {
        console.error("Failed to load subjects", err);
      }
    };

    fetchSubjects();
  }, [activeCourse]);

  const handleSubjectClick = (id) => {
    navigate(`/subjects/recordings/${id}`);
  };

  return (
    <div className="subjectsPage">
      <div className="subjectsHeaderBox">
        <PageHeader title="Recordings" />
      </div>

      <div className="subjectsBodyBox">
        <div className="subjectsGrid">
          {subjectData.map((item) => (
            <SubjectCard
              key={item.id}
              id={item.id}
              subject={item.name}
              teacher={item.teachers?.[0]?.name || "Teacher"}
              img="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600"
              onClick={() => handleSubjectClick(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
