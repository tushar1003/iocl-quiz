import React from "react";
import { useNavigate } from "react-router-dom";

function Instructions({ examData, setView, startTimer }) {
  const navigate = useNavigate();
  return (
    <div>
    <div className="flex flex-col items-center gap-5">
      <ul className="flex flex-col gap-1">
        <h1 className="text-2xl underline">Instructions</h1>
        <li>Exam must be completed in {examData.duration} seconds.</li>
        <li>
          Exam will be submitted automatically after {examData.duration}{" "}
          seconds.
        </li>
        <li>Once submitted, you cannot change your answers.</li>
        <li>Do not refresh the page.</li>
        <li>
          You can use the <span className="font-bold">"Previous"</span> and{" "}
          <span className="font-bold">"Next"</span> buttons to navigate between
          questions.
        </li>
        <li>
          Total marks of the exam is{" "}
          <span className="font-bold">{examData.totalMarks}</span>.
        </li>
        <li>
          Passing marks of the exam is{" "}
          <span className="font-bold">{examData.passingMarks}</span>.
        </li>
      </ul>
</div>
<div className="flex flex-col items-center gap-5">
      <ul className="flex flex-col gap-1">
        <h1 className="text-2xl underline">निर्देश</h1>
        <li>परीक्षा  {examData.duration} सेकंड में पूरी होनी चाहिए.</li>
        <li>
          परीक्षा {examData.duration}{" "} के बाद स्वचालित रूप से सबमिट की जाएगी
          सेकंड.
        </li>
        <li>एक बार सबमिट करने के बाद, आप अपने उत्तर नहीं बदल सकते।</li>
        <li>पेज को रीफ्रेश न करें ।</li>
        <li>
        आप <span className="font-bold">"पिछला"</span> और{" "} का उपयोग कर सकते हैं
           बीच में नेविगेट करने के लिए <span className="font-bold">"Next"</span> बटन
           प्रशन।
        </li>
        <li>
        परीक्षा के कुल अंक हैं{" "}
          <span className="font-bold">{examData.totalMarks}</span>.
        </li>
        <li>
        परीक्षा के उत्तीर्ण अंक हैं {" "}
          <span className="font-bold">{examData.passingMarks}</span>.
        </li>
      </ul>

      <div className="flex gap-2">
        <button className="primary-outlined-btn"
         onClick={()=>navigate('/')}
        >
              CLOSE
        </button>
        <button
          className="primary-contained-btn"
          onClick={() => {
            startTimer();
            setView("questions");
          }}
        >
          Start Exam
        </button>
      </div>
    </div>
    </div>
  );
}

export default Instructions;
