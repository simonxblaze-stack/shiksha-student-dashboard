import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import "../styles/studyMaterial.css";
 import api from "../api/apiClient";

export default function StudyMaterialList() {
  const navigate = useNavigate();
  const [chaptersData, setChaptersData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");


useEffect(() => {
  api.get("/study-material/")
    .then((res) => {

      const materials = res.data.map((item) => {
        const firstFile = item.files?.[0];

        return {
          id: item.id,
          name: item.title,
          date: new Date(item.created_at).toLocaleDateString(),
          fileUrl: firstFile
            ? `https://api.shikshacom.com${firstFile.file}`
            : null
        };
      });

      setChaptersData(materials);
    })
    .catch((err) => {
      console.error("Failed to fetch study materials:", err);
    });
}, []);



const handleView = (chapter) => {
  if (!chapter.fileUrl) return;
  window.open(chapter.fileUrl, "_blank");
};

  const handleDownload = (chapter) => {
    const link = document.createElement("a");
    link.href = chapter.fileUrl;
    link.download = `${chapter.name}.pdf`;
    link.click();
  };

  return (
    <div className="studyMaterialPage">
      <button className="studyMaterialBack" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="studyMaterialHeaderBox">
        <PageHeader title="Study Material" onSearch={setSearchTerm} />
      </div>

      <div className="studyMaterialBodyBox">
        <div className="studyMaterialContent">

          {/* Desktop Table */}
          <div className="studyMaterialTableWrap">
            <table className="studyMaterialTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {chaptersData
                  .filter((chapter) =>
                    chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((chapter) => (
                    <tr key={chapter.id}>
                      <td>{chapter.name}</td>
                      <td>{chapter.date}</td>
                      <td className="studyMaterialActions">
                        <button className="studyMaterialViewBtn" onClick={() => handleView(chapter)}>
                          View
                        </button>
                        <button className="studyMaterialDownloadBtn" onClick={() => handleDownload(chapter)}>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="studyMaterialMobile">
            <div className="studyMaterialMobileHeader">
              <span>Title</span>
              <span>Uploaded On</span>
            </div>

            {chaptersData
              .filter((chapter) =>
                chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((chapter) => (
                <div key={chapter.id} className="studyMaterialCard">
                  <div className="studyMaterialCardTop">
                    <p className="studyMaterialCardTitle">{chapter.name}</p>
                    <p className="studyMaterialCardDate">{chapter.date}</p>
                  </div>
                  <div className="studyMaterialCardActions">
                    <button className="viewBtn" onClick={() => handleView(chapter)}>View</button>
                    <button className="downloadBtn" onClick={() => handleDownload(chapter)}>Download</button>
                  </div>
                </div>
              ))}
          </div>

        </div>
      </div>
    </div>
  );
}
