import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import CourierIndex from './pages/couriers';
import Reports from './pages/couriers/Reports';
import Offices from './pages/couriers/Offices';
import Vehicles from './pages/couriers/vehicles';
import Company from './pages/couriers/Company';
import Office from './pages/couriers/Office';
import EditVehicle from './pages/couriers/EditVehicle';
import VehicleActivity from './pages/couriers/VehicleActivity';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing/>}/>
        <Route path='/auth/courier' element={<Auth/>}/>
        <Route path='/courier' element = {<CourierIndex/>} />
        <Route path='/courier/reports' element = {<Reports/>} />
        <Route path='/courier/offices' element = {<Offices/>} />
        <Route path='/courier/vehicles' element = {<Vehicles/>} />
        <Route path='/courier/company' element = {<Company/>} />
        <Route path='/courier/offices/:id' element={<Office/>} />
        <Route path='/courier/vehicle/:id/activity' element={<VehicleActivity/>} />
        <Route path='/courier/vehicle/:id/edit' element={<EditVehicle/>} />
      </Routes>
    </Router>
  )
}

export default App
