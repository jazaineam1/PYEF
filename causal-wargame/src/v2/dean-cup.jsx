import React from 'react';
import{createRoot}from'react-dom/client';
import './dean/tokens.css';
import './dean-cup.css';
import Player from './dean/player/Player.jsx';
import Wall from './dean/wall/Wall.jsx';
import Teacher from './dean/teacher/Teacher.jsx';

const role=document.body.dataset.role||'student';
createRoot(document.getElementById('root')).render(role==='teacher'?<Teacher/>:role==='wall'?<Wall/>:<Player/>);
