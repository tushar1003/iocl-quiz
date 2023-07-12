import { message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamById } from '../../../apicalls/exams';
import { addReport } from '../../../apicalls/reports';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import Instructions from './Instructions';
import { DownloadOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Popup from 'reactjs-popup';
import SignaturePad from 'react-signature-canvas';
import './sigCanvas.css';
import Webcam from 'react-webcam';
const WebcamComponent = () => <Webcam />;
const videoConstraints = {
  width: 400,
  height: 400,
  facingMode: 'user',
};

// const downloadPDF=()=>{
//   const capture=document.querySelector('.result')
//   html2canvas(capture).then((canvas)=>{
//     const imgData=canvas.toDataURL('img/png');
//     const doc=new jsPDF('p','mm','a4');
//     const componentWidth=doc.internal.pageSize.getWidth();
//     const componentHeight=doc.internal.pageSize.getHeight();
//     doc.addImage(imgData,'PNG',0,0,componentWidth,componentHeight);
//     doc.save('reports.pdf');
//     console.log('yes');
//   })
// }

function WriteExam() {
  const inputRef = useRef(null);
  const printDocument = () => {
    html2canvas(inputRef.current).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'l', // landscape
        unit: 'pt', // points, pixels won't work properly
        format: [canvas.width, canvas.height], // set needed dimensions for any element
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save('download.pdf');
    });
  };

  const [picture, setPicture] = useState('');
  const webcamRef = React.useRef(null);
  const capture = React.useCallback(() => {
    const pictureSrc = webcamRef.current.getScreenshot();
    setPicture(pictureSrc);
  });

  const [imageURL, setImageURL] = useState(null); // create a state that will contain our image url

  const sigCanvas = useRef({});
  const clear = () => sigCanvas.current.clear();
  const save = () =>
    setImageURL(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));

  const [examData, setExamData] = React.useState(null);
  const [questions = [], setQuestions] = React.useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = React.useState(
    Math.floor(Math.random() * 15)
  );
  const [showIndex, setShowIndex] = React.useState(0);
  const [selectedOptions, setSelectedOptions] = React.useState({});
  const [result = {}, setResult] = React.useState({});
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [view, setView] = useState('instructions');
  const [secondsLeft = 0, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const { user } = useSelector((state) => state.users);
  const getExamData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({
        examId: params.id,
      });
      dispatch(HideLoading());
      if (response.success) {
        setQuestions(response.data.questions);
        setExamData(response.data);
        setSecondsLeft(response.data.duration);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const calculateResult = async () => {
    try {
      let correctAnswers = [];
      let wrongAnswers = [];

      questions.forEach((question, index) => {
        if (question.correctOption === selectedOptions[index]) {
          correctAnswers.push(question);
        } else {
          wrongAnswers.push(question);
        }
      });

      let verdict = 'Pass';
      if (correctAnswers.length < examData.passingMarks) {
        verdict = 'Fail';
      }
      const photo = picture;
      const sign = imageURL;
      const gatepass=user.email;
      const tempResult = {
        correctAnswers,
        wrongAnswers,
        verdict,
        photo,
        sign,
      };
      setResult(tempResult);
      dispatch(ShowLoading());
      const response = await addReport({
        exam: params.id,
        result: tempResult,
        user: user._id,
        email:user.email,
      });
      dispatch(HideLoading());
      if (response.success) {
        setView('result');
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const startTimer = () => {
    let totalSeconds = examData.duration;
    const intervalId = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds = totalSeconds - 1;
        setSecondsLeft(totalSeconds);
      } else {
        setTimeUp(true);
      }
    }, 1000);
    setIntervalId(intervalId);
  };

  useEffect(() => {
    if (timeUp && view === 'questions') {
      clearInterval(intervalId);
      calculateResult();
    }
  }, [timeUp]);

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
  }, []);
  return (
    examData && (
      <div className='mt-2' ref={inputRef}>
        <div className='divider'></div>
        <h1 className='text-center'>{examData.name}</h1>
        <div className='divider'></div>

        {view === 'instructions' && (
          <Instructions
            examData={examData}
            setView={setView}
            startTimer={startTimer}
          />
        )}

        {view === 'questions' && (
          <div className='flex flex-col gap-2'>
            <div className='flex justify-between'>
              <h1 className='text-2xl'>
                {showIndex + 1} : {questions[selectedQuestionIndex].name}
              </h1>

              <div className='timer'>
                <span className='text-2xl'>{secondsLeft}</span>
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              {Object.keys(questions[selectedQuestionIndex].options).map(
                (option, index) => {
                  return (
                    <div
                      className={`flex gap-2 flex-col ${
                        selectedOptions[selectedQuestionIndex] === option
                          ? 'selected-option'
                          : 'option'
                      }`}
                      key={index}
                      onClick={() => {
                        setSelectedOptions({
                          ...selectedOptions,
                          [selectedQuestionIndex]: option,
                        });
                      }}
                    >
                      <h1 className='text-xl'>
                        {option} :{' '}
                        {questions[selectedQuestionIndex].options[option]}
                      </h1>
                    </div>
                  );
                }
              )}
            </div>

            <div className='flex justify-between'>
              {showIndex > 0 && (
                <button
                  className='primary-outlined-btn'
                  onClick={() => {
                    setSelectedQuestionIndex(
                      (selectedQuestionIndex - 1 + 15) % 15
                    );
                    setShowIndex(showIndex - 1);
                  }}
                >
                  Previous
                </button>
              )}

              {showIndex < examData.totalMarks - 1 && (
                <button
                  className='primary-contained-btn'
                  onClick={() => {
                    setSelectedQuestionIndex((selectedQuestionIndex + 1) % 15);
                    setShowIndex(showIndex + 1);
                  }}
                >
                  Next
                </button>
              )}

              {showIndex === examData.totalMarks - 1 && (
                <>
                  {picture == '' ? (
                    <Webcam
                      audio={false}
                      height={400}
                      ref={webcamRef}
                      width={400}
                      screenshotFormat='image/jpeg'
                      videoConstraints={videoConstraints}
                    />
                  ) : (
                    <img
                      src={picture}
                      alt='my photo'
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        border: '1px solid black',
                        width: '150px',
                        margin:'0 40px'
                      }}
                    />
                  )}

                  {picture != '' ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setPicture('');
                        // setView('result');
                      }}
                      className='primary-contained-btn'
                    >
                      Retake
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        capture();
                      }}
                      className='primary-contained-btn'
                    >
                      Capture
                    </button>
                  )}

                  {imageURL ? (
                    <img
                      src={imageURL}
                      alt='my signature'
                      style={{
                        display: 'block',
                        margin: '0px -10px',
                        border: '1px solid black',
                        width: '150px',
                      }}
                    />
                  ) : null}

                  <Popup
                    modal
                    trigger={
                      <button className='primary-contained-btn'>
                        {' '}
                        Add Signature{' '}
                      </button>
                    }
                    closeOnDocumentClick={false}
                  >
                    {/* <div style="background-color: red;">this is a popup</div> */}
                    {(close) => (
                      <div className='outer-container'>
                        <SignaturePad
                          ref={sigCanvas}
                          canvasProps={{
                            className: 'signatureCanvas',
                          }}
                        />
                        {/* Button to trigger save canvas image */}
                        <button onClick={save}>Save</button>
                        <button onClick={clear}>Clear</button>
                        <button onClick={close}>Close</button>
                      </div>
                    )}
                  </Popup>
                  <br />
                  <br />

                  {(imageURL && picture)?(<button
                    className='primary-contained-btn'
                    onClick={() => {
                      clearInterval(intervalId);
                      setTimeUp(true);
                    }}
                  >
                    Submit
                  </button>):null}
                </>
              )}
            </div>
          </div>
        )}

        {view === 'result' && (
          <div>
            <div className='flex  items-center mt-2 justify-center result'>
              <div className='flex flex-col gap-2'>
                <h1 className='text-2xl'>RESULT</h1>
                <div className='divider'></div>
                {picture == '' ? (
                  <Webcam
                    audio={false}
                    height={400}
                    ref={webcamRef}
                    width={400}
                    screenshotFormat='image/jpeg'
                    videoConstraints={videoConstraints}
                  />
                ) : (
                  <img
                    src={picture}
                    alt='my photo'
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      // margin: '0px auto',
                      border: '1px solid black',
                      width: '150px',
                    }}
                  />
                )}
                <div className='marks'>
                  <h1 className='text-md'>Name : {user.name}</h1>
                  <h1 className='text-md'>Gate Pass No. : {user.email}</h1>
                  <h1 className='text-md'>
                    Total Marks : {examData.totalMarks}
                  </h1>
                  <h1 className='text-md'>
                    Obtained Marks :{result.correctAnswers.length}
                  </h1>
                  <h1 className='text-md'>
                    Wrong Answers :{' '}
                    {examData.totalMarks - result.correctAnswers.length}
                  </h1>
                  <h1 className='text-md'>
                    Passing Marks : {examData.passingMarks}
                  </h1>
                  <h1 className='text-md'>VERDICT : {result.verdict}</h1>

                  <div className='flex gap-2 mt-2'>
                    <button
                      className='primary-outlined-btn'
                      onClick={() => {
                        navigate('/');
                      }}
                    >
                      Retake Exam
                    </button>
                    <button
                      className='primary-contained-btn lg'
                      onClick={() => {
                        setView('review');
                      }}
                    >
                      Review Answers
                    </button>

                    {/* <button
                      className='primary-contained-btn'
                      onClick={printDocument}
                    >
                      Download Result
                    </button> */}

                    {/* <Popup
                      modal
                      trigger={
                        <button className='primary-contained-btn'>
                          {' '}
                          Add Signature{' '}
                        </button>
                      }
                      closeOnDocumentClick={false}
                    >
                      {(close) => (
                        <div className='outer-container'>
                          <SignaturePad
                            ref={sigCanvas}
                            canvasProps={{
                              className: 'signatureCanvas',
                            }}
                          />
                          <button onClick={save}>Save</button>
                          <button onClick={clear}>Clear</button>
                          <button onClick={close}>Close</button>
                        </div>
                      )}
                    </Popup> */}
                    <br />
                    <br />

                    {imageURL ? (
                      <img
                        src={imageURL}
                        alt='my signature'
                        style={{
                          display: 'block',
                          margin: '0 auto',
                          border: '1px solid black',
                          width: '150px',
                        }}
                      />
                    ) : null}

                    {/* {picture != '' ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setPicture('');
                          // setView('result');
                        }}
                        className='primary-contained-btn'
                      >
                        Retake
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          capture();
                        }}
                        className='primary-contained-btn'
                      >
                        Capture
                      </button>
                    )} */}

                    {imageURL && picture ? (
                      <button
                        className='primary-contained-btn'
                        onClick={printDocument}
                      >
                        Download Result
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className='lottie-animation'>
                {result.verdict === 'Pass' && (
                  <lottie-player
                    src='https://assets2.lottiefiles.com/packages/lf20_ya4ycrti.json'
                    background='transparent'
                    speed='1'
                    loop
                    autoplay
                  ></lottie-player>
                )}

                {result.verdict === 'Fail' && (
                  <lottie-player
                    src='https://assets4.lottiefiles.com/packages/lf20_qp1spzqv.json'
                    background='transparent'
                    speed='1'
                    loop
                    autoplay
                  ></lottie-player>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'review' && (
          <div className='flex flex-col gap-2'>
            {questions.map((question, index) => {
              const isCorrect =
                question.correctOption === selectedOptions[index];
              if (selectedOptions[index] != null) {
                return (
                  <div
                    className={`
                      flex flex-col gap-1 p-2 ${
                        isCorrect ? 'bg-success' : 'bg-error'
                      }
                    `}
                  >
                    <h1 className='text-xl'>{question.name}</h1>
                    <h1 className='text-md'>
                      Submitted Answer : {selectedOptions[index]} -{' '}
                      {question.options[selectedOptions[index]]}
                    </h1>
                    <h1 className='text-md'>
                      Correct Answer : {question.correctOption} -{' '}
                      {question.options[question.correctOption]}
                    </h1>
                  </div>
                );
              }
            })}

            <div className='flex justify-center gap-2'>
              <button
                className='primary-outlined-btn'
                onClick={() => {
                  setView('result');
                }}
              >
                Close
              </button>
              <button
                className='primary-contained-btn'
                onClick={() => {
                  navigate('/');
                }}
              >
                Retake Exam
              </button>
            </div>
          </div>
        )}
      </div>
    )
  );
}

export default WriteExam;
