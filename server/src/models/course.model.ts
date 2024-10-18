import mongoose, { Document, Schema } from "mongoose";

export interface IContent extends Document {
    id: number;
    title: string;
    description: string;
    videoUrl: string;
    thumbnail: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAssignment extends Document {
    id: number;
    publicTestCases: string[];
    privateTestCases: string[];
    question: string;
    solution: string;
    gptEvaluation: string;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IChapter extends Document {
    id: number;
    chapterName: String;
    content: IContent[];
    assignment: IAssignment[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ICourse extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    courseName: String;
    courseDescription: String;
    thumbnailUrl: String;
    chapter: IChapter[];
    createdAt: Date;
    updatedAt: Date;
}

const CourseSchema: Schema<ICourse> = new mongoose.Schema(
    {
        courseName: {
            type: String,
            required: true,
        },
        courseDescription: {
            type: String,
            required: true,
        },
        thumbnailUrl: {
            type: String,
            default: "",
        },
        chapter: [
            {
                id: {
                    type: Number,
                    required: true,
                },
                chapterName: {
                    type: String,
                    required: true,
                },
                content: [
                    {
                        id: {
                            type: Number,
                            required: true,
                        },
                        title: {
                            type: String,
                            required: true,
                        },
                        decription: {
                            type: String,
                            required: true,
                        },
                        videoUrl: {
                            type: String,
                            required: true,
                        },
                        thumbnail: {
                            type: String,
                            required: true,
                        }
                    }
                ],
                assignment: [
                    {
                        id: {
                            type: Number,
                            required: true,
                        },
                        publicTestCases: {
                            type: [String],
                            required: true,
                        },
                        privateTestCases: {
                            type: [String],
                            required: true,
                        },
                        question: {
                            type: String,
                            required: true,
                        },
                        solution: {
                            type: String,
                            required: true,
                        },
                        gptEvaluation: {
                            type: String,
                            required: true,
                        },
                        submittedAt: {
                            type: Date,
                            default: Date.now,
                        }
                    }
                ]
            }
        ]
    },
    {
        timestamps: true,
    }
)

const Course = mongoose.model<ICourse>("Course", CourseSchema);
export default Course;
