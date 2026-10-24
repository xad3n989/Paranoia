# Makefile for MinGW on Windows
CXX = g++
CXXFLAGS = -O3 -Wall -std=c++17
LDFLAGS = -lwininet -lws2_32 -liphlpapi -ladvapi32 -lshell32 -static-libgcc -static-libstdc++
TARGET = paranoia.exe
SRC = paranoia.cpp

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET) $(LDFLAGS)

clean:
	del /f $(TARGET)
