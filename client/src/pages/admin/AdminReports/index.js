import React, { useRef, useState } from 'react';
import PageTitle from '../../../components/PageTitle';
import { Button, message, Table } from 'antd';
import { useDispatch } from 'react-redux';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { getAllReports } from '../../../apicalls/reports';
import { useEffect } from 'react';
import moment from 'moment';
import { DownloadOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
function AdminReports() {
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

  const [loader, setLoader] = React.useState(false);
  const downloadPDF = () => {
    const capture = document.querySelector('#finalTable');
    setLoader(true);
    html2canvas(capture).then((canvas) => {
      const imgData = canvas.toDataURL('img/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const componentWidth = doc.internal.pageSize.getWidth();
      const componentHeight = doc.internal.pageSize.getHeight();
      doc.addImage(imgData, 'PNG', 0, 0, componentWidth, componentHeight);
      setLoader(false);
      doc.save('reports.pdf');
    });
  };
  const [reportsData, setReportsData] = React.useState([]);
  const dispatch = useDispatch();
  const [filters, setFilters] = React.useState({
    examName: '',
    userName: '',
  });
  const columns = [
    {
      title: 'Exam Name',
      dataIndex: 'examName',
      render: (text, record) => <>{record.exam.name}</>,
    },
    {
      title: 'User Name',
      dataIndex: 'userName',
      render: (text, record) => <>{record.user.name}</>,
    },
    {
      title: 'Gate Pass No.',
      dataIndex: 'Gate Pass No.',
      render: (text, record) => <>{record.user.email}</>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      render: (text, record) => (
        <>{moment(record.createdAt).format('DD-MM-YYYY hh:mm:ss')}</>
      ),
    },
    {
      title: 'Total Marks',
      dataIndex: 'totalQuestions',
      render: (text, record) => <>{record.exam.totalMarks}</>,
    },
    {
      title: 'Passing Marks',
      dataIndex: 'correctAnswers',
      render: (text, record) => <>{record.exam.passingMarks}</>,
    },
    {
      title: 'Obtained Marks',
      dataIndex: 'correctAnswers',
      render: (text, record) => <>{record.result.correctAnswers.length}</>,
    },
    {
      title: 'Verdict',
      dataIndex: 'verdict',
      render: (text, record) => <>{record.result.verdict}</>,
    },
    {
      title: 'Image',
      dataIndex: 'image',
      render: (text, record) => (
        <>
          {' '}
          <img
            src={record.result.photo}
            alt=''
            style={{
              display: 'flex',
              flexDirection: 'row',
              border: '1px solid black',
              width: '100px',
              margin: '0 0',
            }}
          />{' '}
        </>
      ),
    },
    {
      title: 'Signature',
      dataIndex: 'signature',
      render: (text, record) => (
        <>
          {' '}
          <img
            src={record.result.sign}
            alt=''
            style={{
              display: 'flex',
              flexDirection: 'row',
              border: '1px solid black',
              width: '100px',
              margin: '0 0',
            }}
          />{' '}
        </>
      ),
    },
  ];

  const getData = async (tempFilters) => {
    try {
      dispatch(ShowLoading());
      const response = await getAllReports(tempFilters);
      if (response.success) {
        setReportsData(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData(filters);
  }, []);

  return (
    <div ref={inputRef}>
      <PageTitle title='Reports' />
      <div className='divider'></div>
      <div className='flex gap-2 '>
        <input
          type='text'
          placeholder='Exam'
          value={filters.examName}
          onChange={(e) => setFilters({ ...filters, examName: e.target.value })}
        />
        <input
          type='text'
          placeholder='User'
          value={filters.userName}
          onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
        />
        <button
          className='primary-outlined-btn'
          onClick={() => {
            setFilters({
              examName: '',
              userName: '',
            });
            getData({
              examName: '',
              userName: '',
            });
          }}
        >
          Clear
        </button>
        <button
          className='primary-contained-btn'
          onClick={() => getData(filters)}
        >
          Search
        </button>
        <button className='primary-contained-btn' onClick={printDocument}>
          Download Reports
        </button>
        {/* <Button type="primary" shape="round" icon={<DownloadOutlined />} onClick={downloadPDF} disabled={!(loader===false)} /> */}
      </div>
      <Table
        id='finalTable'
        columns={columns}
        dataSource={reportsData}
        className='mt-2'
        
      />
    </div>
  );
}

export default AdminReports;
