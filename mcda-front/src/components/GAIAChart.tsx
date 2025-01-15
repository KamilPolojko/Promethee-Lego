import React, {useState} from 'react';
import {Criterias} from "@/app/enums/criterias_enum";

const GAIAChart = ({properties, decisionAxis}: { properties:{
        criterias:{
            name:string;
            x: number;
            y: number;
        }[];
        alternatives:{
            name: string;
            x:number;
            y:number;
        }[];
        explained_variance: number[];
    } | undefined,decisionAxis: number[]| undefined }) => {
    const [showCriterias, setShowCriterias] = useState(true);
    const [showAlternatives, setShowAlternatives] = useState(true);
    const [showDecisionAxis, setShowDecisionAxis] = useState(true);

    const width = 700;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 280;

    const [x = 0, y = 0] = decisionAxis || [];

    const decisionAxisScaled = {
        x: x * scale,
        y: y * scale
    };

    return (
        <div className="w-full max-w-4xl p-4">

            <div className="flex gap-4 mb-4 items-center justify-center">
                <button
                    onClick={() => setShowCriterias(!showCriterias)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 
                        ${showCriterias
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Criterias
                </button>
                <button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 
                        ${showAlternatives
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Alternatives
                </button>

                <button
                    onClick={() => setShowDecisionAxis(!showDecisionAxis)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 
                        ${showDecisionAxis
                        ? 'bg-[#FF0000] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Decision Axis
                </button>


                <div>
                    {`Quality: ${properties?.explained_variance ? parseFloat((properties.explained_variance[0] * 100).toFixed(1)) : 0} %`}
                </div>
            </div>

            <svg width={width} height={height} className="bg-white">
                <line
                    x1="0"
                    y1={centerY}
                    x2={width}
                    y2={centerY}
                    stroke="#ccc"
                    strokeWidth="1"
                />
                <line
                    x1={centerX}
                    y1="0"
                    x2={centerX}
                    y2={height}
                    stroke="#ccc"
                    strokeWidth="1"
                />

                {showCriterias && properties?.criterias.map((criterion, index) => (
                    <g key={`criterion-${index}`}>
                        <line
                            x1={centerX}
                            y1={centerY}
                            x2={centerX + criterion.x * scale}
                            y2={centerY - criterion.y * scale}
                            stroke="#0000FF"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                        <text
                            x={centerX + criterion.x * scale + 5}
                            y={centerY - criterion.y * scale - 5}
                            fontSize="12"
                            fill="#0000FF"
                        >
                            {Criterias[Number(criterion.name)]}
                        </text>
                        <circle
                            cx={centerX + criterion.x * scale}
                            cy={centerY - criterion.y * scale}
                            r="6"
                            fill="#0000FF"
                        />
                    </g>
                ))}

                {showAlternatives && properties?.alternatives.map((alt, index) => (
                    <g key={`alternative-${index}`}>
                        <line
                            x1={centerX}
                            y1={centerY}
                            x2={centerX + alt.x * scale}
                            y2={centerY - alt.y * scale}
                            stroke="#00CED1"
                            strokeWidth="1.5"
                        />
                        <rect
                            x={centerX + alt.x * scale - 6}
                            y={centerY - alt.y * scale - 6}
                            width="12"
                            height="12"
                            fill="#00CED1"
                        />
                        <text
                            x={centerX + alt.x * scale + 15}
                            y={centerY - alt.y * scale}
                            fontSize="12"
                            fill="#000"
                        >
                            {alt.name}
                        </text>
                    </g>
                ))}


                {
                    showDecisionAxis && (
                        <>
                            <line
                                x1={centerX}
                                y1={centerY}
                                x2={centerX + decisionAxisScaled.x}
                                y2={centerY - decisionAxisScaled.y}
                                stroke="#FF0000"
                                strokeWidth="3"
                                markerEnd="url(#circlehead)"/>
                            <defs>
                                <marker
                                    id="circlehead"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="5"
                                    refY="5"
                                    orient="auto"
                                >
                                    <circle
                                        cx="5"
                                        cy="5"
                                        r="4"
                                        fill="#FF0000"
                                    />
                                </marker>
                            </defs>
                        </>

                    )
                }


            </svg>


        </div>
    );
};

export default GAIAChart;