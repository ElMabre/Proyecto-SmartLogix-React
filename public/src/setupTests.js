import '@testing-library/jest-dom'
import React from 'react'
globalThis.React = React
// jsdom doesn't implement scrollTo; provide a harmless stub for tests
if (typeof window !== 'undefined' && !window.scrollTo) {
	window.scrollTo = () => {}
}