#pragma once
#include <vector>
#include <string>
#include <sstream>
#include <cmath>
#include <stdexcept>
#include "polynomial.h"

struct MatrixResult {
    std::vector<std::vector<double>> matrix;
    double determinant;
    bool hasDeterminant;
    std::vector<StepResult> steps;
    std::string error;
};

class Matrix {
public:
    int rows, cols;
    std::vector<std::vector<double>> data;

    Matrix(int r, int c) : rows(r), cols(c), data(r, std::vector<double>(c, 0.0)) {}

    Matrix(const std::vector<std::vector<double>>& d) : data(d) {
        rows = d.size();
        cols = rows > 0 ? d[0].size() : 0;
    }

    std::string toString() const {
        std::ostringstream oss;
        for (int i = 0; i < rows; i++) {
            oss << "[ ";
            for (int j = 0; j < cols; j++) {
                oss << Polynomial::formatNum(data[i][j]);
                if (j < cols - 1) oss << ", ";
            }
            oss << " ]";
            if (i < rows - 1) oss << "\n";
        }
        return oss.str();
    }

    static MatrixResult add(const Matrix& a, const Matrix& b) {
        MatrixResult res;
        if (a.rows != b.rows || a.cols != b.cols) {
            res.error = "Matrix dimensions must match for addition";
            return res;
        }
        Matrix c(a.rows, a.cols);
        res.steps.push_back({"Matrix Addition: Aᵢⱼ + Bᵢⱼ", "Add corresponding elements"});
        for (int i = 0; i < a.rows; i++)
            for (int j = 0; j < a.cols; j++)
                c.data[i][j] = a.data[i][j] + b.data[i][j];
        res.matrix = c.data;
        res.hasDeterminant = false;
        res.steps.push_back({c.toString(), "Result matrix"});
        return res;
    }

    static MatrixResult multiply(const Matrix& a, const Matrix& b) {
        MatrixResult res;
        if (a.cols != b.rows) {
            res.error = "A columns must equal B rows for multiplication";
            return res;
        }
        Matrix c(a.rows, b.cols);
        res.steps.push_back({"Matrix Multiplication: Cᵢⱼ = Σ Aᵢₖ × Bₖⱼ",
                              "Dot product of rows of A with columns of B"});
        for (int i = 0; i < a.rows; i++)
            for (int j = 0; j < b.cols; j++)
                for (int k = 0; k < a.cols; k++)
                    c.data[i][j] += a.data[i][k] * b.data[k][j];
        res.matrix = c.data;
        res.hasDeterminant = false;
        res.steps.push_back({c.toString(), "Result matrix"});
        return res;
    }

    static double det(const std::vector<std::vector<double>>& m, int n) {
        if (n == 1) return m[0][0];
        if (n == 2) return m[0][0]*m[1][1] - m[0][1]*m[1][0];
        double d = 0;
        std::vector<std::vector<double>> sub(n-1, std::vector<double>(n-1));
        for (int f = 0; f < n; f++) {
            int si = 0;
            for (int i = 1; i < n; i++) {
                int sj = 0;
                for (int j = 0; j < n; j++) {
                    if (j == f) continue;
                    sub[si][sj++] = m[i][j];
                }
                si++;
            }
            d += (f % 2 == 0 ? 1 : -1) * m[0][f] * det(sub, n-1);
        }
        return d;
    }

    static MatrixResult determinant(const Matrix& a) {
        MatrixResult res;
        if (a.rows != a.cols) {
            res.error = "Determinant requires a square matrix";
            return res;
        }
        res.steps.push_back({"Computing determinant via cofactor expansion", ""});
        res.determinant = det(a.data, a.rows);
        res.hasDeterminant = true;
        res.matrix = a.data;
        res.steps.push_back({"det(A) = " + Polynomial::formatNum(res.determinant), "Final determinant"});
        return res;
    }

    static MatrixResult inverse(const Matrix& a) {
        MatrixResult res;
        if (a.rows != a.cols) {
            res.error = "Inverse requires a square matrix";
            return res;
        }
        int n = a.rows;
        double d = det(a.data, n);
        if (std::abs(d) < 1e-12) {
            res.error = "Matrix is singular (determinant = 0), inverse does not exist";
            return res;
        }

        res.steps.push_back({"Gauss-Jordan Elimination: [A|I] → [I|A⁻¹]", ""});
        res.steps.push_back({"det(A) = " + Polynomial::formatNum(d) + " ≠ 0, inverse exists", ""});

        // Build augmented matrix [A | I]
        std::vector<std::vector<double>> aug(n, std::vector<double>(2*n));
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) aug[i][j] = a.data[i][j];
            aug[i][n + i] = 1.0;
        }

        for (int col = 0; col < n; col++) {
            // Partial pivot
            int maxRow = col;
            for (int i = col+1; i < n; i++)
                if (std::abs(aug[i][col]) > std::abs(aug[maxRow][col])) maxRow = i;
            std::swap(aug[col], aug[maxRow]);

            double pivot = aug[col][col];
            for (int j = 0; j < 2*n; j++) aug[col][j] /= pivot;

            for (int i = 0; i < n; i++) {
                if (i == col) continue;
                double factor = aug[i][col];
                for (int j = 0; j < 2*n; j++) aug[i][j] -= factor * aug[col][j];
            }
        }

        Matrix inv(n, n);
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                inv.data[i][j] = aug[i][n + j];

        res.matrix = inv.data;
        res.hasDeterminant = true;
        res.determinant = d;
        res.steps.push_back({inv.toString(), "A⁻¹ (Inverse Matrix)"});
        return res;
    }

    static MatrixResult gaussianElimination(const Matrix& a) {
        MatrixResult res;
        res.steps.push_back({"Gaussian Elimination with partial pivoting", ""});

        int n = a.rows;
        auto m = a.data;

        for (int col = 0; col < std::min(n, a.cols); col++) {
            // Pivot
            int maxRow = col;
            for (int i = col+1; i < n; i++)
                if (std::abs(m[i][col]) > std::abs(m[maxRow][col])) maxRow = i;
            std::swap(m[col], m[maxRow]);

            std::ostringstream pv;
            pv << "Pivot row " << (col+1) << ": leading element = " << Polynomial::formatNum(m[col][col]);
            res.steps.push_back({pv.str(), ""});

            if (std::abs(m[col][col]) < 1e-12) continue;

            for (int i = col+1; i < n; i++) {
                double factor = m[i][col] / m[col][col];
                for (int j = col; j < a.cols; j++)
                    m[i][j] -= factor * m[col][j];
                std::ostringstream es;
                es << "R" << (i+1) << " = R" << (i+1) << " - " << Polynomial::formatNum(factor) << " × R" << (col+1);
                res.steps.push_back({es.str(), ""});
            }
        }

        res.matrix = m;
        res.hasDeterminant = false;
        Matrix echelon(m);
        res.steps.push_back({echelon.toString(), "Row Echelon Form"});
        return res;
    }
};
